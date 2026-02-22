import { z } from "zod";
import { listActivities, listActivityTypes } from "../client/rest.js";
import { formatTimeAgo } from "../utils.js";

export const listActivitiesSchema = z.object({
  activityTypes: z
    .array(z.number())
    .optional()
    .describe("Filter by activity type IDs (integers)"),
  siteIds: z
    .array(z.string())
    .optional()
    .describe("Filter by site IDs"),
  accountIds: z
    .array(z.string())
    .optional()
    .describe("Filter by account IDs"),
  agentIds: z
    .array(z.string())
    .optional()
    .describe("Filter by agent IDs"),
  threatIds: z
    .array(z.string())
    .optional()
    .describe("Filter by threat IDs"),
  createdAt__gt: z
    .string()
    .optional()
    .describe("Activities created after this datetime (ISO 8601)"),
  createdAt__lt: z
    .string()
    .optional()
    .describe("Activities created before this datetime (ISO 8601)"),
  sortBy: z
    .string()
    .optional()
    .describe("Sort by field: createdAt, activityType"),
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

export const listActivityTypesSchema = z.object({});

function summarizeActivity(a: Record<string, any>): string {
  const desc = a.primaryDescription || "No description";
  const type = a.activityType ?? "unknown";
  const time = a.createdAt ? formatTimeAgo(a.createdAt) : "unknown";
  const site = a.siteName || "N/A";
  const agent = a.agentId || "N/A";

  return `\u2022 ${desc} | Type: ${type} | ${time}\n  Site: ${site} | Agent: ${agent}`;
}

export async function handleListActivities(
  params: z.infer<typeof listActivitiesSchema>
) {
  try {
    const result = await listActivities({
      limit: params.limit || 25,
      cursor: params.cursor,
      activityTypes: params.activityTypes,
      siteIds: params.siteIds,
      accountIds: params.accountIds,
      agentIds: params.agentIds,
      threatIds: params.threatIds,
      createdAt__gt: params.createdAt__gt,
      createdAt__lt: params.createdAt__lt,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No activities found matching criteria.",
          },
        ],
      };
    }

    const summary = result.data.map(summarizeActivity).join("\n\n");
    const header = `Found ${result.data.length} activit${result.data.length === 1 ? "y" : "ies"}:\n\n`;
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

export async function handleListActivityTypes(
  _params: z.infer<typeof listActivityTypesSchema>
) {
  try {
    const result = await listActivityTypes();

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No activity types found.",
          },
        ],
      };
    }

    const summary = result.data
      .map((t: Record<string, any>) => `\u2022 ${t.id}: ${t.action} \u2014 ${t.descriptionTemplate}`)
      .join("\n");
    const header = `Found ${result.data.length} activity type(s):\n\n`;

    return {
      content: [
        {
          type: "text" as const,
          text: header + summary,
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
