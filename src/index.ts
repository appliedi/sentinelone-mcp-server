#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadConfig } from "./config.js";
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
import { hashReputationSchema, handleHashReputation } from "./tools/hash.js";
import {
  dvQuerySchema,
  dvGetEventsSchema,
  handleDVQuery,
  handleDVGetEvents,
} from "./tools/dv.js";

async function main() {
  // Validate config before starting
  try {
    loadConfig();
  } catch (error) {
    console.error(
      `Configuration error: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }

  const server = new McpServer({
    name: "sentinelone",
    version: "1.0.0",
  });

  // Register threat tools
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

  // Register agent tools
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

  // Register alerts tool (GraphQL)
  server.tool(
    "s1_list_alerts",
    "List unified alerts via GraphQL. Use storylineId to correlate with threats.",
    listAlertsSchema.shape,
    handleListAlerts
  );

  // Register hash reputation tool
  server.tool(
    "s1_hash_reputation",
    "Lookup reputation for a SHA1 or SHA256 hash",
    hashReputationSchema.shape,
    handleHashReputation
  );

  // Register Deep Visibility tools
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

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
