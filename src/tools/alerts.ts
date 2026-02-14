import { z } from "zod";
import { queryAlerts } from "../client/graphql.js";
import { formatTimeAgo } from "../utils.js";

export const listAlertsSchema = z.object({
  limit: z.number().min(1).max(50).optional().describe("Max results (default 20, max 50)"),
  cursor: z.string().optional().describe("Pagination cursor (endCursor from previous response)"),
  severity: z
    .string()
    .optional()
    .describe("Filter by severity: Low, Medium, High, Critical"),
  analystVerdict: z
    .string()
    .optional()
    .describe("Filter by analyst verdict: TruePositive, FalsePositive, Suspicious, Undefined"),
  incidentStatus: z
    .string()
    .optional()
    .describe("Filter by incident status: Unresolved, InProgress, Resolved"),
  siteIds: z.array(z.string()).optional().describe("Filter by site IDs"),
  storylineId: z
    .string()
    .optional()
    .describe("Filter by storyline ID (correlate with threat)"),
});

function summarizeAlert(a: Record<string, any>): string {
  const severity = a.severity || "Unknown";
  const status = a.status || "Unknown";
  const verdict = a.analystVerdict?.replace("_", " ") || "UNDEFINED";
  const time = a.detectedAt ? formatTimeAgo(a.detectedAt) : "unknown";
  const classification = a.classification || "N/A";
  const confidence = a.confidenceLevel || "N/A";

  return `• ${a.name || "Unknown"} | ${severity} | ${status} | ${time}
  ID: ${a.id} | Verdict: ${verdict}
  Classification: ${classification} | Confidence: ${confidence}
  Storyline: ${a.storylineId || "N/A"}`;
}

export async function handleListAlerts(
  params: z.infer<typeof listAlertsSchema>
) {
  try {
    const result = await queryAlerts(params);

    if (!result.alerts?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No alerts found matching criteria.",
          },
        ],
      };
    }

    const summary = result.alerts.map(summarizeAlert).join("\n\n");
    const header = `Found ${result.alerts.length} alert(s):\n\n`;
    const footer = result.pageInfo.hasNextPage
      ? `\n\n[More results available - use cursor: ${result.pageInfo.endCursor}]`
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
          text: `Error listing alerts: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
