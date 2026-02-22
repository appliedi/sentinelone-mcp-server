import { z } from "zod";

const configSchema = z
  .object({
    apiKey: z
      .string({ required_error: "SENTINELONE_API_KEY environment variable is required" })
      .min(1, "SENTINELONE_API_KEY cannot be empty"),
    apiBase: z
      .string({ required_error: "SENTINELONE_API_BASE environment variable is required" })
      .url("SENTINELONE_API_BASE must be a valid URL (e.g., https://usea1.sentinelone.net)")
      .transform((url) => url.replace(/\/$/, "")), // Remove trailing slash
    transport: z.enum(["stdio", "http"]).default("stdio"),
    port: z.coerce.number().int().min(1).max(65535).default(3000),
    authToken: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.transport === "http" && !data.authToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MCP_AUTH_TOKEN is required when MCP_TRANSPORT is 'http'",
        path: ["authToken"],
      });
    }
  });

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const result = configSchema.safeParse({
    apiKey: process.env.SENTINELONE_API_KEY,
    apiBase: process.env.SENTINELONE_API_BASE,
    transport: process.env.MCP_TRANSPORT || "stdio",
    port: process.env.MCP_PORT || process.env.PORT || 3000,
    authToken: process.env.MCP_AUTH_TOKEN,
  });

  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message).join(", ");
    throw new Error(`Configuration error: ${errors}`);
  }

  return result.data;
}

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}
