import { z } from "zod";
import { listExclusions, listRestrictions } from "../client/rest.js";

export const listExclusionsSchema = z.object({
  type: z
    .string()
    .optional()
    .describe("Exclusion type: path, white_hash, certificate, file_type, browser"),
  osTypes: z
    .array(z.string())
    .optional()
    .describe("Filter by OS: windows, linux, macos"),
  siteIds: z
    .array(z.string())
    .optional()
    .describe("Filter by site IDs"),
  query: z
    .string()
    .optional()
    .describe("Full-text search across exclusion values"),
  value__contains: z
    .string()
    .optional()
    .describe("Filter by value (partial match)"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Max results (default 25, max 100)"),
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
});

export const listBlocklistSchema = z.object({
  siteIds: z
    .array(z.string())
    .optional()
    .describe("Filter by site IDs"),
  osTypes: z
    .array(z.string())
    .optional()
    .describe("Filter by OS: windows, linux, macos"),
  query: z
    .string()
    .optional()
    .describe("Full-text search across blocklist values"),
  value__contains: z
    .string()
    .optional()
    .describe("Filter by value (partial match)"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Max results (default 25, max 100)"),
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
});

function summarizeExclusion(e: Record<string, any>): string {
  const type = e.type || "unknown";
  const value = e.value || "N/A";
  const os = e.osType || "all";
  const scope = e.scopeName || "Global";
  const user = e.userName || "N/A";
  const created = e.createdAt || "unknown";

  return `\u2022 ${type}: ${value} | OS: ${os} | Scope: ${scope}\n  User: ${user} | Created: ${created}`;
}

export async function handleListExclusions(
  params: z.infer<typeof listExclusionsSchema>
) {
  try {
    const result = await listExclusions({
      limit: params.limit || 25,
      cursor: params.cursor,
      type: params.type,
      osTypes: params.osTypes,
      siteIds: params.siteIds,
      query: params.query,
      value__contains: params.value__contains,
    });

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No exclusions found matching criteria.",
          },
        ],
      };
    }

    const summary = result.data.map(summarizeExclusion).join("\n\n");
    const header = `Found ${result.data.length} exclusion(s):\n\n`;
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

export async function handleListBlocklist(
  params: z.infer<typeof listBlocklistSchema>
) {
  try {
    const result = await listRestrictions({
      limit: params.limit || 25,
      cursor: params.cursor,
      siteIds: params.siteIds,
      osTypes: params.osTypes,
      query: params.query,
      value__contains: params.value__contains,
    });

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No blocklist entries found matching criteria.",
          },
        ],
      };
    }

    const summary = result.data.map(summarizeExclusion).join("\n\n");
    const header = `Found ${result.data.length} blocklist entr${result.data.length === 1 ? "y" : "ies"}:\n\n`;
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
