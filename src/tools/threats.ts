import { z } from "zod";
import { listThreats, getThreat, mitigateThreat } from "../client/rest.js";
import type { MitigationAction } from "../client/types.js";
import { formatTimeAgo } from "../utils.js";

export const listThreatsSchema = z.object({
  computerName: z
    .string()
    .optional()
    .describe("Search by computer/endpoint name (partial match)"),
  threatName: z
    .string()
    .optional()
    .describe("Search by threat name (partial match)"),
  limit: z
    .number()
    .min(1)
    .max(1000)
    .optional()
    .describe("Max results (default 25, max 1000)"),
  mitigationStatuses: z
    .array(z.string())
    .optional()
    .describe("Filter: not_mitigated, mitigated, marked_as_benign"),
  classifications: z
    .array(z.string())
    .optional()
    .describe("Filter: Malware, PUA, Suspicious"),
  analystVerdicts: z
    .array(z.string())
    .optional()
    .describe("Filter: true_positive, false_positive, suspicious, undefined"),
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

export const getThreatSchema = z.object({
  threatId: z.string().describe("The threat ID to retrieve"),
});

export const mitigateThreatSchema = z.object({
  threatId: z.string().describe("The threat ID to mitigate"),
  action: z
    .enum(["kill", "quarantine", "remediate", "rollback-remediation"])
    .describe("Action: kill, quarantine, remediate, rollback-remediation"),
});

function summarizeThreat(t: Record<string, any>): string {
  const computer = t.agentRealtimeInfo?.agentComputerName || "Unknown";
  const threat = t.threatInfo?.threatName || "Unknown";
  const classification = t.threatInfo?.classification || "Unknown";
  const status = t.threatInfo?.mitigationStatus || "unknown";
  const time = t.threatInfo?.createdAt ? formatTimeAgo(t.threatInfo.createdAt) : "unknown";
  const user = t.agentDetectionInfo?.agentLastLoggedInUserName || "unknown";
  const filePath = t.threatInfo?.filePath || "";
  const id = t.id;

  return `• ${computer} | ${threat} | ${classification} | ${status} | ${time}
  ID: ${id} | User: ${user}
  Path: ${filePath}`;
}

export async function handleListThreats(
  params: z.infer<typeof listThreatsSchema>
) {
  try {
    const result = await listThreats({
      limit: params.limit || 25,
      cursor: params.cursor,
      computerNameContains: params.computerName,
      threatNameContains: params.threatName,
      mitigationStatuses: params.mitigationStatuses,
      classifications: params.classifications,
      analystVerdicts: params.analystVerdicts,
      siteIds: params.siteIds,
      groupIds: params.groupIds,
    });

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No threats found matching criteria.",
          },
        ],
      };
    }

    const summary = result.data.map(summarizeThreat).join("\n\n");
    const totalItems = result.pagination?.totalItems;
    const header = totalItems
      ? `Found ${result.data.length} of ${totalItems} threat(s):\n\n`
      : `Found ${result.data.length} threat(s):\n\n`;
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

export async function handleGetThreat(params: z.infer<typeof getThreatSchema>) {
  try {
    const result = await getThreat(params.threatId);
    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Threat ${params.threatId} not found`,
          },
        ],
        isError: true,
      };
    }

    const t = result.data[0] as Record<string, any>;
    const details = `Threat Details:
─────────────────────────────────────
Computer: ${t.agentRealtimeInfo?.agentComputerName || "Unknown"}
Threat: ${t.threatInfo?.threatName || "Unknown"}
Classification: ${t.threatInfo?.classification || "Unknown"}
Confidence: ${t.threatInfo?.confidenceLevel || "Unknown"}
Status: ${t.threatInfo?.mitigationStatus || "Unknown"}
Analyst Verdict: ${t.threatInfo?.analystVerdict || "undefined"}
─────────────────────────────────────
ID: ${t.id}
Storyline ID: ${t.threatInfo?.storyline || "N/A"}
Created: ${t.threatInfo?.createdAt || "Unknown"}
─────────────────────────────────────
User: ${t.agentDetectionInfo?.agentLastLoggedInUserName || "Unknown"}
Agent ID: ${t.agentRealtimeInfo?.agentId || "Unknown"}
OS: ${t.agentDetectionInfo?.agentOsName || "Unknown"}
─────────────────────────────────────
File Path: ${t.threatInfo?.filePath || "N/A"}
SHA256: ${t.threatInfo?.sha256 || "N/A"}
SHA1: ${t.threatInfo?.sha1 || "N/A"}
MD5: ${t.threatInfo?.md5 || "N/A"}`;

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

export async function handleMitigateThreat(
  params: z.infer<typeof mitigateThreatSchema>
) {
  try {
    const result = await mitigateThreat(
      params.threatId,
      params.action as MitigationAction
    );
    return {
      content: [
        {
          type: "text" as const,
          text: `✓ ${params.action} applied to threat ${params.threatId}. Affected: ${result.data.affected}`,
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
