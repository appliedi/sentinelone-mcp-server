#!/usr/bin/env node
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { loadConfig, type Config } from "./config.js";
import {
  listThreatsSchema,
  getThreatSchema,
  mitigateThreatSchema,
  handleListThreats,
  handleGetThreat,
  handleMitigateThreat,
} from "./tools/threats.js";
import {
  listAgentsSchema,
  getAgentSchema,
  isolateAgentSchema,
  reconnectAgentSchema,
  handleListAgents,
  handleGetAgent,
  handleIsolateAgent,
  handleReconnectAgent,
} from "./tools/agents.js";
import { listAlertsSchema, handleListAlerts } from "./tools/alerts.js";
import { hashLookupSchema, handleHashLookup } from "./tools/hash.js";
import {
  dvQuerySchema,
  dvGetEventsSchema,
  handleDVQuery,
  handleDVGetEvents,
} from "./tools/dv.js";
import {
  listSitesSchema,
  getSiteSchema,
  handleListSites,
  handleGetSite,
} from "./tools/sites.js";

function registerTools(server: McpServer): void {
  server.tool(
    "s1_list_threats",
    "List SentinelOne threats with optional filters",
    listThreatsSchema.shape,
    handleListThreats
  );

  server.tool(
    "s1_get_threat",
    "Get a specific SentinelOne threat by ID",
    getThreatSchema.shape,
    handleGetThreat
  );

  server.tool(
    "s1_mitigate_threat",
    "Mitigate a threat: kill (terminate process), quarantine (isolate file), remediate (full cleanup), rollback-remediation (undo)",
    mitigateThreatSchema.shape,
    handleMitigateThreat
  );

  server.tool(
    "s1_list_agents",
    "List SentinelOne agents with optional filters",
    listAgentsSchema.shape,
    handleListAgents
  );

  server.tool(
    "s1_get_agent",
    "Get a specific SentinelOne agent by ID",
    getAgentSchema.shape,
    handleGetAgent
  );

  server.tool(
    "s1_isolate_agent",
    "Network isolate an agent (disconnect from network while maintaining S1 communication)",
    isolateAgentSchema.shape,
    handleIsolateAgent
  );

  server.tool(
    "s1_reconnect_agent",
    "Remove network isolation from an agent",
    reconnectAgentSchema.shape,
    handleReconnectAgent
  );

  server.tool(
    "s1_list_alerts",
    "List unified alerts via GraphQL. Use storylineId to correlate with threats.",
    listAlertsSchema.shape,
    handleListAlerts
  );

  server.tool(
    "s1_hash_reputation",
    "Hunt a SHA1/SHA256 hash across the fleet via Deep Visibility. Returns endpoints, processes, and file paths where the hash was seen in the last 14 days.",
    hashLookupSchema.shape,
    handleHashLookup
  );

  server.tool(
    "s1_dv_query",
    'Run a Deep Visibility query. Returns queryId when complete. Example query: ProcessName Contains "python"',
    dvQuerySchema.shape,
    handleDVQuery
  );

  server.tool(
    "s1_dv_get_events",
    "Get events from a completed Deep Visibility query",
    dvGetEventsSchema.shape,
    handleDVGetEvents
  );

  // Register site tools
  server.tool(
    "s1_list_sites",
    "List SentinelOne sites with optional filters. Use to discover site IDs for scoping other queries.",
    listSitesSchema.shape,
    handleListSites
  );

  server.tool(
    "s1_get_site",
    "Get detailed information about a specific SentinelOne site by ID, including licenses, expiration, and account info.",
    getSiteSchema.shape,
    handleGetSite
  );
}

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

async function startHttpServer(config: Config): Promise<void> {
  const { port, authToken } = config;

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // Parse URL and strip query string for path matching
    const parsedUrl = new URL(req.url || "/", `http://${req.headers.host}`);

    // Only accept POST on /mcp
    if (parsedUrl.pathname !== "/mcp" || req.method !== "POST") {
      res.writeHead(req.method === "GET" || req.method === "DELETE" ? 405 : 404, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify({ error: parsedUrl.pathname !== "/mcp" ? "Not Found" : "Method Not Allowed" }));
      return;
    }

    // Validate token via Authorization header or ?token= query parameter
    const authHeader = req.headers.authorization;
    const queryToken = parsedUrl.searchParams.get("token");
    const tokenValid =
      (authHeader && authHeader === `Bearer ${authToken}`) ||
      (queryToken && queryToken === authToken);

    if (!tokenValid) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    // Parse request body
    let body: object;
    try {
      const raw = await readRequestBody(req);
      body = JSON.parse(raw);
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid JSON" }));
      return;
    }

    // Create per-request server and transport (stateless mode)
    const server = new McpServer({
      name: "sentinelone",
      version: "1.0.0",
    });
    registerTools(server);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, body);

    // Cleanup on response close
    res.on("close", () => {
      transport.close();
      server.close();
    });
  });

  httpServer.listen(port, () => {
    console.error(`SentinelOne MCP server (HTTP) listening on port ${port}`);
    console.error(`Endpoint: POST http://localhost:${port}/mcp`);
  });
}

async function main() {
  let config: Config;
  try {
    config = loadConfig();
  } catch (error) {
    console.error(
      `Configuration error: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }

  if (config.transport === "http") {
    await startHttpServer(config);
  } else {
    // Parent PID watchdog: auto-exit when parent (Claude Code) dies to prevent zombie processes
    const parentPid = process.ppid;
    const WATCHDOG_INTERVAL_MS = 5000;
    setInterval(() => {
      try {
        process.kill(parentPid, 0); // signal 0 = existence check, no actual signal sent
      } catch {
        process.exit(0);
      }
    }, WATCHDOG_INTERVAL_MS);

    const server = new McpServer({
      name: "sentinelone",
      version: "1.0.0",
    });
    registerTools(server);

    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
