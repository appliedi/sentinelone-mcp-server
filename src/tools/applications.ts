import { z } from "zod";
import { listAppRisks, listAppInventory } from "../client/rest.js";

export const listAppRisksSchema = z.object({
  siteIds: z
    .array(z.string())
    .optional()
    .describe("Filter by site IDs"),
  accountIds: z
    .array(z.string())
    .optional()
    .describe("Filter by account IDs"),
  severities: z
    .array(z.string())
    .optional()
    .describe("Filter by severity: critical, high, medium, low"),
  cveId__contains: z
    .string()
    .optional()
    .describe("Filter by CVE ID (partial match)"),
  applicationNames: z
    .array(z.string())
    .optional()
    .describe("Filter by application names"),
  exploitedInTheWild: z
    .boolean()
    .optional()
    .describe("Filter for CVEs exploited in the wild"),
  mitigationStatus: z
    .string()
    .optional()
    .describe("Filter by mitigation status"),
  sortBy: z
    .string()
    .optional()
    .describe("Sort by: riskScore, severity, applicationName"),
  sortOrder: z
    .string()
    .optional()
    .describe("Sort direction: asc or desc"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Max results (default 25, max 100)"),
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
});

export const listAppInventorySchema = z.object({
  siteIds: z
    .array(z.string())
    .optional()
    .describe("Filter by site IDs"),
  name__contains: z
    .string()
    .optional()
    .describe("Filter by application name (partial match)"),
  vendor__contains: z
    .string()
    .optional()
    .describe("Filter by vendor name (partial match)"),
  osTypes: z
    .array(z.string())
    .optional()
    .describe("Filter by OS: windows, linux, macos"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Max results (default 25, max 100)"),
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
});

function summarizeAppRisk(r: Record<string, any>): string {
  const cve = r.cveId || "N/A";
  const severity = r.severity || "unknown";
  const app = r.applicationName || "Unknown";
  const vendor = r.applicationVendor || "Unknown";
  const score = r.riskScore ?? "N/A";
  const exploited = r.exploitedInTheWild ? "Yes" : "No";
  const status = r.mitigationStatus || "N/A";

  return `\u2022 ${cve} | ${severity} | ${app} ${vendor}\n  Score: ${score} | Exploited: ${exploited} | Status: ${status}`;
}

function summarizeAppInventory(a: Record<string, any>): string {
  const name = a.applicationName || "Unknown";
  const vendor = a.applicationVendor || "Unknown";
  const endpoints = a.endpointsCount ?? 0;
  const versions = a.applicationVersionsCount ?? 0;

  return `\u2022 ${name} | ${vendor} | Endpoints: ${endpoints} | Versions: ${versions}`;
}

export async function handleListAppRisks(
  params: z.infer<typeof listAppRisksSchema>
) {
  try {
    const result = await listAppRisks({
      limit: params.limit || 25,
      cursor: params.cursor,
      siteIds: params.siteIds,
      accountIds: params.accountIds,
      severities: params.severities,
      cveId__contains: params.cveId__contains,
      applicationNames: params.applicationNames,
      exploitedInTheWild: params.exploitedInTheWild,
      mitigationStatus: params.mitigationStatus,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No application risks found matching criteria.",
          },
        ],
      };
    }

    const summary = result.data.map(summarizeAppRisk).join("\n\n");
    const header = `Found ${result.data.length} application risk(s):\n\n`;
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

export async function handleListAppInventory(
  params: z.infer<typeof listAppInventorySchema>
) {
  try {
    const result = await listAppInventory({
      limit: params.limit || 25,
      cursor: params.cursor,
      siteIds: params.siteIds,
      name__contains: params.name__contains,
      vendor__contains: params.vendor__contains,
      osTypes: params.osTypes,
    });

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No application inventory items found matching criteria.",
          },
        ],
      };
    }

    const summary = result.data.map(summarizeAppInventory).join("\n\n");
    const header = `Found ${result.data.length} application(s):\n\n`;
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
