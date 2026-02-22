import { z } from "zod";
import { listGroups, getGroup } from "../client/rest.js";

export const listGroupsSchema = z.object({
  siteIds: z
    .array(z.string())
    .optional()
    .describe("Filter by site IDs"),
  type: z
    .string()
    .optional()
    .describe("Filter by type: static, dynamic, pinned"),
  query: z
    .string()
    .optional()
    .describe("Full-text search across group names"),
  name: z
    .string()
    .optional()
    .describe("Filter by exact group name"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Max results (default 25, max 100)"),
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
});

export const getGroupSchema = z.object({
  groupId: z.string().describe("The group ID to retrieve"),
});

function summarizeGroup(g: Record<string, any>): string {
  const name = g.name || "Unknown";
  const type = g.type || "unknown";
  const isDefault = g.isDefault ? "Yes" : "No";
  const id = g.id;
  const siteId = g.siteId || "N/A";

  return `\u2022 ${name} | Type: ${type} | Default: ${isDefault}\n  ID: ${id} | Site: ${siteId}`;
}

export async function handleListGroups(
  params: z.infer<typeof listGroupsSchema>
) {
  try {
    const result = await listGroups({
      limit: params.limit || 25,
      cursor: params.cursor,
      siteIds: params.siteIds,
      type: params.type,
      query: params.query,
      name: params.name,
    });

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No groups found matching criteria.",
          },
        ],
      };
    }

    const summary = result.data.map(summarizeGroup).join("\n\n");
    const header = `Found ${result.data.length} group(s):\n\n`;
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

export async function handleGetGroup(params: z.infer<typeof getGroupSchema>) {
  try {
    const result = await getGroup(params.groupId);
    if (!result.data) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Group ${params.groupId} not found`,
          },
        ],
        isError: true,
      };
    }

    const g = result.data as Record<string, any>;
    const details = `Group Details:
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
Name: ${g.name || "Unknown"}
Type: ${g.type || "N/A"}
Default: ${g.isDefault ? "Yes" : "No"}
Inherits: ${g.inherits ? "Yes" : "No"}
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
ID: ${g.id}
Site: ${g.siteName || "N/A"} (${g.siteId || "N/A"})
Rank: ${g.rank ?? "N/A"}
Total Agents: ${g.totalAgents ?? 0}
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
Filter: ${g.filterName || "None"} (${g.filterId || "N/A"})
Registration Token: ${g.registrationToken || "N/A"}
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
Created: ${g.createdAt || "Unknown"} by ${g.creator || "Unknown"}
Updated: ${g.updatedAt || "Unknown"}`;

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
