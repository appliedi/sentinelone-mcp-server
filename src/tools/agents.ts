import { z } from "zod";
import {
  listAgents,
  getAgent,
  isolateAgent,
  reconnectAgent,
} from "../client/rest.js";
import { formatTimeAgo } from "../utils.js";

export const listAgentsSchema = z.object({
  computerName: z
    .string()
    .optional()
    .describe("Search by computer name (partial match)"),
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max results (default 25, max 1000)"),
  osTypes: z
    .array(z.string())
    .optional()
    .describe("Filter by OS: windows, macos, linux"),
  isActive: z.boolean().optional().describe("Filter by active status"),
  isInfected: z.boolean().optional().describe("Filter by infected status"),
  networkStatuses: z
    .array(z.string())
    .optional()
    .describe("Filter: connected, disconnected"),
  siteIds: z
    .array(z.string())
    .optional()
    .describe("Filter by site IDs"),
  groupIds: z
    .array(z.string())
    .optional()
    .describe("Filter by group IDs"),
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
});

export const getAgentSchema = z.object({
  agentId: z.string().describe("The agent ID to retrieve"),
});

export const isolateAgentSchema = z.object({
  agentId: z.string().describe("The agent ID to network isolate"),
});

export const reconnectAgentSchema = z.object({
  agentId: z.string().describe("The agent ID to reconnect"),
});

function summarizeAgent(a: Record<string, any>): string {
  const name = a.computerName || "Unknown";
  const os = a.osName || a.osType || "Unknown";
  const status = a.networkStatus || "unknown";
  const infected = a.infected ? "INFECTED" : "clean";
  const lastActive = a.lastActiveDate ? formatTimeAgo(a.lastActiveDate) : "unknown";
  const user = a.lastLoggedInUserName || "unknown";
  const id = a.id;
  const ip = a.externalIp || a.lastIpToMgmt || "N/A";

  return `• ${name} | ${os} | ${status} | ${infected} | ${lastActive}
  ID: ${id} | User: ${user} | IP: ${ip}`;
}

export async function handleListAgents(
  params: z.infer<typeof listAgentsSchema>
) {
  try {
    const result = await listAgents({
      limit: params.limit || 25,
      cursor: params.cursor,
      computerNameContains: params.computerName,
      osTypes: params.osTypes,
      isActive: params.isActive,
      isInfected: params.isInfected,
      networkStatuses: params.networkStatuses,
      siteIds: params.siteIds,
      groupIds: params.groupIds,
    });

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No agents found matching criteria.",
          },
        ],
      };
    }

    const summary = result.data.map(summarizeAgent).join("\n\n");
    const totalItems = result.pagination?.totalItems;
    const header = totalItems
      ? `Found ${result.data.length} of ${totalItems} agent(s):\n\n`
      : `Found ${result.data.length} agent(s):\n\n`;
    const footer = result.pagination?.nextCursor
      ? `\n\nMore results available. Use cursor: "${result.pagination.nextCursor}"`
      : "";

    return {
      content: [
        {
          type: "text" as const,
          text: header + summary + footer,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleGetAgent(params: z.infer<typeof getAgentSchema>) {
  try {
    const result = await getAgent(params.agentId);
    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Agent ${params.agentId} not found`,
          },
        ],
        isError: true,
      };
    }

    const a = result.data[0] as Record<string, any>;
    const details = `Agent Details:
─────────────────────────────────────
Computer: ${a.computerName || "Unknown"}
OS: ${a.osName || "Unknown"} ${a.osRevision || ""}
Status: ${a.networkStatus || "Unknown"}
Infected: ${a.infected ? "YES" : "No"}
Active: ${a.isActive ? "Yes" : "No"}
─────────────────────────────────────
ID: ${a.id}
UUID: ${a.uuid || "N/A"}
Domain: ${a.domain || "N/A"}
Site: ${a.siteName || "N/A"}
Group: ${a.groupName || "N/A"}
─────────────────────────────────────
Last Active: ${a.lastActiveDate || "Unknown"}
User: ${a.lastLoggedInUserName || "Unknown"}
External IP: ${a.externalIp || "N/A"}
Agent Version: ${a.agentVersion || "N/A"}`;

    return {
      content: [
        {
          type: "text" as const,
          text: details,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleIsolateAgent(
  params: z.infer<typeof isolateAgentSchema>
) {
  try {
    const result = await isolateAgent(params.agentId);
    return {
      content: [
        {
          type: "text" as const,
          text: `✓ Agent ${params.agentId} isolated. Affected: ${result.data.affected}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleReconnectAgent(
  params: z.infer<typeof reconnectAgentSchema>
) {
  try {
    const result = await reconnectAgent(params.agentId);
    return {
      content: [
        {
          type: "text" as const,
          text: `✓ Agent ${params.agentId} reconnected. Affected: ${result.data.affected}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
