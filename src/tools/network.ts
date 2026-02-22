import { z } from "zod";
import { listRangerInventory, listTags, listIOCs } from "../client/rest.js";

export const listRangerInventorySchema = z.object({
  siteIds: z
    .array(z.string())
    .optional()
    .describe("Filter by site IDs"),
  managedStates: z
    .array(z.string())
    .optional()
    .describe("Filter by managed state: managed, unmanaged, notManageable"),
  deviceTypes: z
    .array(z.string())
    .optional()
    .describe("Filter by device types"),
  osTypes: z
    .array(z.string())
    .optional()
    .describe("Filter by OS: windows, linux, macos"),
  query: z
    .string()
    .optional()
    .describe("Full-text search across ranger inventory"),
  localIp__contains: z
    .string()
    .optional()
    .describe("Filter by local IP (partial match)"),
  macAddress__contains: z
    .string()
    .optional()
    .describe("Filter by MAC address (partial match)"),
  hostnames__contains: z
    .string()
    .optional()
    .describe("Filter by hostname (partial match)"),
  firstSeen__gt: z
    .string()
    .optional()
    .describe("Devices first seen after this datetime (ISO 8601)"),
  lastSeen__gt: z
    .string()
    .optional()
    .describe("Devices last seen after this datetime (ISO 8601)"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Max results (default 25, max 100)"),
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
});

export const listTagsSchema = z.object({
  type: z
    .string()
    .describe("Tag type (required): firewall, network-quarantine, device-inventory"),
  siteIds: z
    .array(z.string())
    .optional()
    .describe("Filter by site IDs"),
  query: z
    .string()
    .optional()
    .describe("Full-text search across tag names"),
  name__contains: z
    .string()
    .optional()
    .describe("Filter by tag name (partial match)"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Max results (default 25, max 100)"),
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
});

export const listIOCsSchema = z.object({
  siteIds: z
    .array(z.string())
    .optional()
    .describe("Filter by site IDs"),
  type: z
    .string()
    .optional()
    .describe("IOC type: DNS, IPV4, URL, SHA1, SHA256, MD5"),
  value: z
    .string()
    .optional()
    .describe("Filter by IOC value"),
  severity: z
    .string()
    .optional()
    .describe("Filter by severity"),
  source: z
    .string()
    .optional()
    .describe("Filter by source"),
  creator__contains: z
    .string()
    .optional()
    .describe("Filter by creator (partial match)"),
  name__contains: z
    .string()
    .optional()
    .describe("Filter by IOC name (partial match)"),
  creationTime__gt: z
    .string()
    .optional()
    .describe("IOCs created after this datetime (ISO 8601)"),
  creationTime__lt: z
    .string()
    .optional()
    .describe("IOCs created before this datetime (ISO 8601)"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Max results (default 25, max 100)"),
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
});

function summarizeRangerDevice(d: Record<string, any>): string {
  const ip = d.localIp || "N/A";
  const os = d.osName || "unknown";
  const type = d.deviceType || "unknown";
  const state = d.managedState || "unknown";
  const mac = d.macAddress || "N/A";
  const manufacturer = d.manufacturer || "N/A";
  const lastSeen = d.lastSeen || "unknown";

  return `\u2022 ${ip} | ${os} | ${type} | ${state}\n  MAC: ${mac} | Manufacturer: ${manufacturer} | Last seen: ${lastSeen}`;
}

function summarizeTag(t: Record<string, any>): string {
  const name = t.name || "Unknown";
  const type = t.type || "unknown";
  const kind = t.kind || "N/A";
  const id = t.id;
  const created = t.createdAt || "unknown";

  return `\u2022 ${name} | Type: ${type} | Kind: ${kind}\n  ID: ${id} | Created: ${created}`;
}

function summarizeIOC(i: Record<string, any>): string {
  const type = i.type || "unknown";
  const value = i.value || "N/A";
  const severity = i.severity || "N/A";
  const source = i.source || "N/A";
  const created = i.creationTime || "unknown";
  const category = i.category || "N/A";

  return `\u2022 ${type}: ${value} | Severity: ${severity} | Source: ${source}\n  Created: ${created} | Category: ${category}`;
}

export async function handleListRangerInventory(
  params: z.infer<typeof listRangerInventorySchema>
) {
  try {
    const result = await listRangerInventory({
      limit: params.limit || 25,
      cursor: params.cursor,
      siteIds: params.siteIds,
      managedStates: params.managedStates,
      deviceTypes: params.deviceTypes,
      osTypes: params.osTypes,
      query: params.query,
      localIp__contains: params.localIp__contains,
      macAddress__contains: params.macAddress__contains,
      hostnames__contains: params.hostnames__contains,
      firstSeen__gt: params.firstSeen__gt,
      lastSeen__gt: params.lastSeen__gt,
    });

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No Ranger inventory items found matching criteria.",
          },
        ],
      };
    }

    const summary = result.data.map(summarizeRangerDevice).join("\n\n");
    const header = `Found ${result.data.length} device(s):\n\n`;
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

export async function handleListTags(
  params: z.infer<typeof listTagsSchema>
) {
  try {
    const result = await listTags({
      type: params.type,
      limit: params.limit || 25,
      cursor: params.cursor,
      siteIds: params.siteIds,
      query: params.query,
      name__contains: params.name__contains,
    });

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No tags found matching criteria.",
          },
        ],
      };
    }

    const summary = result.data.map(summarizeTag).join("\n\n");
    const header = `Found ${result.data.length} tag(s):\n\n`;
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

export async function handleListIOCs(
  params: z.infer<typeof listIOCsSchema>
) {
  try {
    const result = await listIOCs({
      limit: params.limit || 25,
      cursor: params.cursor,
      siteIds: params.siteIds,
      type: params.type,
      value: params.value,
      severity: params.severity,
      source: params.source,
      creator__contains: params.creator__contains,
      name__contains: params.name__contains,
      creationTime__gt: params.creationTime__gt,
      creationTime__lt: params.creationTime__lt,
    });

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No IOCs found matching criteria.",
          },
        ],
      };
    }

    const summary = result.data.map(summarizeIOC).join("\n\n");
    const header = `Found ${result.data.length} IOC(s):\n\n`;
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
