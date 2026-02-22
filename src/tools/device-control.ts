import { z } from "zod";
import { listDeviceControlEvents } from "../client/rest.js";

export const listDeviceControlEventsSchema = z.object({
  siteIds: z
    .array(z.string())
    .optional()
    .describe("Filter by site IDs"),
  interfaces: z
    .array(z.string())
    .optional()
    .describe("Filter by interface: USB, Bluetooth, Thunderbolt, SDCard"),
  eventTypes: z
    .array(z.string())
    .optional()
    .describe("Filter by event types"),
  agentIds: z
    .array(z.string())
    .optional()
    .describe("Filter by agent IDs"),
  eventTime__gt: z
    .string()
    .optional()
    .describe("Events after this datetime (ISO 8601)"),
  eventTime__lt: z
    .string()
    .optional()
    .describe("Events before this datetime (ISO 8601)"),
  query: z
    .string()
    .optional()
    .describe("Full-text search across device control events"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Max results (default 25, max 100)"),
  cursor: z.string().optional().describe("Pagination cursor from previous response"),
});

function summarizeDeviceControlEvent(e: Record<string, any>): string {
  const iface = e.interface || "unknown";
  const eventType = e.eventType || "unknown";
  const permission = e.accessPermission || "N/A";
  const time = e.eventTime || "unknown";
  const agent = e.agentId || "N/A";
  const vendor = e.vendorId || "N/A";
  const product = e.productId || "N/A";

  return `\u2022 ${iface} | ${eventType} | ${permission} | ${time}\n  Agent: ${agent} | Device: ${vendor}:${product}`;
}

export async function handleListDeviceControlEvents(
  params: z.infer<typeof listDeviceControlEventsSchema>
) {
  try {
    const result = await listDeviceControlEvents({
      limit: params.limit || 25,
      cursor: params.cursor,
      siteIds: params.siteIds,
      interfaces: params.interfaces,
      eventTypes: params.eventTypes,
      agentIds: params.agentIds,
      eventTime__gt: params.eventTime__gt,
      eventTime__lt: params.eventTime__lt,
      query: params.query,
    });

    if (!result.data?.length) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No device control events found matching criteria.",
          },
        ],
      };
    }

    const summary = result.data.map(summarizeDeviceControlEvent).join("\n\n");
    const header = `Found ${result.data.length} device control event(s):\n\n`;
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
