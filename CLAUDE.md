# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MCP server for SentinelOne integration. Exposes 25 tools for managing threats, agents, alerts, hash intelligence, Deep Visibility queries, activities, exclusions, groups, applications, device control, Ranger network inventory, tags, and IOCs via the Model Context Protocol.

## Commands

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm run dev          # Run with tsx (development)
npm start            # Run compiled server (dist/index.js)
```

No test framework is configured. No linter is configured.

## Required Environment Variables

- `SENTINELONE_API_KEY` — SentinelOne API token
- `SENTINELONE_API_BASE` — Tenant URL (e.g., `https://your-tenant.sentinelone.net`)

### Optional (HTTP transport)

- `MCP_TRANSPORT` — `stdio` (default) or `http`
- `MCP_PORT` — HTTP port (default 3000, also reads `PORT` as fallback for Cloud Run)
- `MCP_AUTH_TOKEN` — Required when `MCP_TRANSPORT=http`; used for Bearer token auth

## Architecture

```
src/index.ts          ← MCP server setup, tool registration, parent PID watchdog
src/config.ts         ← Zod-validated env config, cached via getConfig()
src/utils.ts          ← formatTimeAgo, sanitizeError (redacts API key), truncatePath
src/client/rest.ts    ← Generic REST client with 30s AbortController timeout
src/client/graphql.ts ← GraphQL client (used only for alerts)
src/client/types.ts   ← All TypeScript interfaces (Threat, Agent, Alert, DVEvent, etc.)
src/tools/            ← One file per domain, each exports Zod schemas + handler functions
  threats.ts          ← s1_list_threats, s1_get_threat, s1_mitigate_threat
  agents.ts           ← s1_list_agents, s1_get_agent, s1_isolate_agent, s1_reconnect_agent
  alerts.ts           ← s1_list_alerts (GraphQL)
  hash.ts             ← s1_hash_reputation
  dv.ts               ← s1_dv_query, s1_dv_get_events
  sites.ts            ← s1_list_sites, s1_get_site
  activities.ts       ← s1_list_activities, s1_list_activity_types
  exclusions.ts       ← s1_list_exclusions, s1_list_blocklist
  groups.ts           ← s1_list_groups, s1_get_group
  applications.ts     ← s1_list_app_risks, s1_list_app_inventory
  device-control.ts   ← s1_list_device_control_events
  network.ts          ← s1_list_ranger_inventory, s1_list_tags, s1_list_iocs
```

**Data flow:** `index.ts` registers tools → tool handlers (tools/*.ts) validate params via Zod → call API clients (client/*.ts) → return MCP-formatted responses.

## Tool Module Pattern

Every tool file exports paired Zod schemas and async handler functions:

```typescript
export const listThreatsSchema = z.object({ ... });
export async function handleListThreats(params: z.infer<typeof listThreatsSchema>) {
  // returns { content: [{ type: "text", text: "..." }], isError?: boolean }
}
```

Tools are registered in `index.ts` using `server.tool(name, description, schema.shape, handler)`.

## Key Implementation Details

- **ES modules** — `"type": "module"` in package.json; all imports use `.js` extensions
- **Strict TypeScript** — tsconfig targets ES2022 with NodeNext module resolution
- **Error handling** — All handlers wrap in try-catch, errors pass through `sanitizeError()` to redact API keys, responses use `isError: true` flag
- **API auth** — `Authorization: ApiToken ${apiKey}` header on all requests
- **Retry logic** — Hash lookup and DV tools retry on 409 conflicts with backoff
- **Pagination** — Cursor-based across all list endpoints; nextCursor passed through responses
- **Parent watchdog** — Process auto-exits when parent PID dies (5s poll interval)

## Adding a New Tool

1. Define types in `src/client/types.ts`
2. Add API call in `src/client/rest.ts` (or `graphql.ts`)
3. Create `src/tools/<domain>.ts` with Zod schema + handler following the existing pattern
4. Register in `src/index.ts` via `server.tool()`
