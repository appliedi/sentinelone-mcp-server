import { z } from "zod";
import { listSites, getSite } from "../client/rest.js";

export const listSitesSchema = z.object({
  nameContains: z
    .array(z.string())
    .optional()
    .describe("Filter by site name (partial match, multiple values)"),
  query: z
    .string()
    .optional()
    .describe("Full-text search across name, account name, and description"),
  state: z
    .string()
    .optional()
    .describe("Filter by state: active, deleted, expired"),
  siteType: z
    .string()
    .optional()
    .describe("Filter by type: Paid or Trial"),
  sku: z.string().optional().describe("Filter by SKU: core, control, complete"),
  accountIds: z
    .array(z.string())
    .optional()
    .describe("Filter by account IDs"),
  siteIds: z
    .array(z.string())
    .optional()
    .describe("Filter by site IDs"),
  sortBy: z
    .string()
    .optional()
    .describe("Sort by: name, state, siteType, createdAt, expiration, activeLicenses, totalLicenses"),
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

export const getSiteSchema = z.object({
  siteId: z.string().describe("The site ID to retrieve"),
});

function summarizeSite(s: Record<string, any>): string {
  const name = s.name || "Unknown";
  const state = s.state || "unknown";
  const type = s.siteType || "unknown";
  const sku = s.sku || "N/A";
  const licenses = `${s.activeLicenses ?? 0}/${s.totalLicenses ?? 0}`;
  const account = s.accountName || "N/A";
  const id = s.id;

  return `• ${name} | ${state} | ${type} | SKU: ${sku} | Licenses: ${licenses}
  ID: ${id} | Account: ${account}`;
}

export async function handleListSites(
  params: z.infer<typeof listSitesSchema>
) {
  try {
    const result = await listSites({
      limit: params.limit || 25,
      cursor: params.cursor,
      nameContains: params.nameContains,
      query: params.query,
      state: params.state,
      siteType: params.siteType,
      sku: params.sku,
      accountIds: params.accountIds,
      siteIds: params.siteIds,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });

    const sites = result.data?.sites;
    if (!sites?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No sites found matching criteria.",
          },
        ],
      };
    }

    const allSites = result.data.allSites;
    const summary = sites.map(summarizeSite).join("\n\n");
    const header = `Found ${sites.length} site(s) (Total licenses: ${allSites.activeLicenses}/${allSites.totalLicenses}):\n\n`;
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

export async function handleGetSite(params: z.infer<typeof getSiteSchema>) {
  try {
    const result = await getSite(params.siteId);
    if (!result.data) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Site ${params.siteId} not found`,
          },
        ],
        isError: true,
      };
    }

    const s = result.data as Record<string, any>;
    const expiration = s.unlimitedExpiration ? "Unlimited" : (s.expiration || "N/A");
    const licenses = s.unlimitedLicenses
      ? `${s.activeLicenses ?? 0}/Unlimited`
      : `${s.activeLicenses ?? 0}/${s.totalLicenses ?? 0}`;

    const details = `Site Details:
─────────────────────────────────────
Name: ${s.name || "Unknown"}
State: ${s.state || "Unknown"}
Type: ${s.siteType || "N/A"}
SKU: ${s.sku || "N/A"}
─────────────────────────────────────
ID: ${s.id}
Account: ${s.accountName || "N/A"} (${s.accountId || "N/A"})
Description: ${s.description || "N/A"}
External ID: ${s.externalId || "N/A"}
─────────────────────────────────────
Licenses: ${licenses}
Expiration: ${expiration}
Default Site: ${s.isDefault ? "Yes" : "No"}
─────────────────────────────────────
Created: ${s.createdAt || "Unknown"} by ${s.creator || "Unknown"}
Updated: ${s.updatedAt || "Unknown"}`;

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
