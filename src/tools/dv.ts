import { z } from "zod";
import { createDVQuery, getDVQueryStatus, getDVEvents } from "../client/rest.js";
import { formatTimeAgo, truncatePath } from "../utils.js";

export const dvQuerySchema = z.object({
  query: z
    .string()
    .describe(
      'Deep Visibility query (e.g., ProcessName Contains "python", SrcIP = "10.0.0.1")'
    ),
  fromDate: z
    .string()
    .describe("Start date in ISO format (e.g., 2024-01-01T00:00:00Z)"),
  toDate: z
    .string()
    .describe("End date in ISO format (e.g., 2024-01-02T00:00:00Z)"),
  siteIds: z.array(z.string()).optional().describe("Filter by site IDs"),
  groupIds: z.array(z.string()).optional().describe("Filter by group IDs"),
  accountIds: z.array(z.string()).optional().describe("Filter by account IDs"),
});

export const dvGetEventsSchema = z.object({
  queryId: z.string().describe("Query ID returned from s1_dv_query"),
  limit: z.number().min(1).max(100).optional().describe("Max results (default 50, max 100)"),
  cursor: z.string().optional().describe("Pagination cursor"),
});

function summarizeEvent(e: Record<string, any>): string {
  const time = e.eventTime ? formatTimeAgo(e.eventTime) : "unknown";
  const type = e.eventType || "Unknown";
  const process = e.processName || "N/A";
  const agent = e.agentName || "Unknown";

  let details = "";
  if (e.srcIp && e.dstIp) details += ` | ${e.srcIp} -> ${e.dstIp}:${e.dstPort || "?"}`;
  else if (e.dstIp) details += ` -> ${e.dstIp}:${e.dstPort || "?"}`;
  if (e.filePath) details += ` | ${truncatePath(e.filePath, 60)}`;
  if (e.dnsRequest) details += ` | DNS: ${e.dnsRequest}`;
  if (e.user) details += ` | User: ${e.user}`;

  return `• ${type} | ${agent} | ${process} | ${time}${details}`;
}

export async function handleDVQuery(params: z.infer<typeof dvQuerySchema>) {
  try {
    const result = await createDVQuery({
      query: params.query,
      fromDate: params.fromDate,
      toDate: params.toDate,
      siteIds: params.siteIds,
      groupIds: params.groupIds,
      accountIds: params.accountIds,
    });

    // Poll for status until query completes or fails
    let status = await getDVQueryStatus(result.queryId);
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (status.status === "RUNNING" && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      status = await getDVQueryStatus(result.queryId);
      attempts++;
    }

    if (status.status === "FAILED") {
      return {
        content: [
          {
            type: "text" as const,
            text: `Deep Visibility query failed: ${status.responseError || "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }

    if (status.status === "RUNNING") {
      return {
        content: [
          {
            type: "text" as const,
            text: `Query still running after ${maxAttempts} seconds. Use s1_dv_get_events with queryId: ${result.queryId} to retrieve results later.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              queryId: result.queryId,
              status: status.status,
              message:
                "Query completed. Use s1_dv_get_events to retrieve results.",
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error running Deep Visibility query: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

export async function handleDVGetEvents(
  params: z.infer<typeof dvGetEventsSchema>
) {
  try {
    // Check query status first
    const status = await getDVQueryStatus(params.queryId);

    if (status.status === "RUNNING") {
      return {
        content: [
          {
            type: "text" as const,
            text: `Query ${params.queryId} is still running (${status.progressStatus || 0}% complete). Please wait and try again.`,
          },
        ],
      };
    }

    if (status.status === "FAILED") {
      return {
        content: [
          {
            type: "text" as const,
            text: `Query ${params.queryId} failed: ${status.responseError || "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }

    if (status.status === "CANCELED") {
      return {
        content: [
          {
            type: "text" as const,
            text: `Query ${params.queryId} was canceled`,
          },
        ],
        isError: true,
      };
    }

    const result = await getDVEvents({
      queryId: params.queryId,
      limit: params.limit ?? 50,
      cursor: params.cursor,
    });

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No events found for this query.",
          },
        ],
      };
    }

    const summary = result.data.map(summarizeEvent).join("\n");
    const header = `Found ${result.data.length} event(s):\n\n`;
    const footer = result.pagination?.nextCursor
      ? `\n\n[More results available - use cursor: ${result.pagination.nextCursor}]`
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
          text: `Error getting Deep Visibility events: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
