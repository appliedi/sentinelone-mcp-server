# sentinelone-mcp-server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/c0tton-fluff/sentinelone-mcp-server)](https://github.com/c0tton-fluff/sentinelone-mcp-server/releases)

MCP server for [SentinelOne](https://www.sentinelone.com/) integration. Enables AI assistants like Claude Code to manage threats, investigate endpoints, query alerts, hunt with Deep Visibility, and much more — 25 tools across 13 categories.

## Features

- **Threat management** — List, inspect, and mitigate threats (kill, quarantine, remediate, rollback)
- **Agent operations** — List agents, get details, network isolate/reconnect endpoints
- **Unified alerts** — Query alerts via GraphQL with severity, verdict, and storyline filters
- **Hash intelligence** — SHA1/SHA256 reputation lookups via Deep Visibility fleet-wide hunt
- **Deep Visibility** — Run threat hunting queries with automatic polling and pagination
- **Sites management** — List and inspect sites, discover site IDs for scoping queries
- **Activity logs** — Audit trail of console actions with type/time/agent filters
- **Exclusions & blocklist** — Audit whitelisted paths/hashes and blocked items
- **Group management** — List and inspect groups, view agent counts and policies
- **Application risks & inventory** — CVE vulnerability tracking and installed app inventory
- **Device control** — Monitor USB, Bluetooth, Thunderbolt, and SDCard events
- **Ranger network inventory** — Discover managed and unmanaged devices on the network
- **Tags & IOCs** — Manage firewall/quarantine/inventory tags and threat intelligence indicators
- **HTTP transport** — Run as a stateless HTTP server for Docker/Cloud Run deployments
- **Error sanitization** — API keys are redacted from all error messages

## Installation

```bash
git clone https://github.com/c0tton-fluff/sentinelone-mcp-server.git
cd sentinelone-mcp-server
npm install && npm run build
```

## Quick Start

**1. Get your SentinelOne API token**

Log into your S1 console > Profile icon (top right) > **My Profile** > Actions > **API token operations** > **Regenerate API token**.

**2. Configure MCP client (stdio)**

Add to `~/.mcp.json`:

```json
{
  "mcpServers": {
    "sentinelone": {
      "command": "node",
      "args": ["/path/to/sentinelone-mcp-server/dist/index.js"],
      "env": {
        "SENTINELONE_API_KEY": "your_api_token_here",
        "SENTINELONE_API_BASE": "https://your-tenant.sentinelone.net"
      }
    }
  }
}
```

**3. Use with Claude Code**

```
"List all unmitigated threats"
"Show infected agents"
"Isolate agent 1234567890"
"What's the reputation of this SHA256?"
"Hunt for PowerShell processes in the last 24 hours"
"Show high severity alerts"
"List all sites and their license counts"
"Show recent activity log entries"
"List exclusions for Windows endpoints"
"Show critical CVEs exploited in the wild"
"List unmanaged devices on the network"
"Show IOCs from the last 7 days"
```

## HTTP Transport

Run as an HTTP server for Docker or Cloud Run deployments:

```bash
MCP_TRANSPORT=http \
MCP_PORT=8080 \
MCP_AUTH_TOKEN=your-secret-token \
SENTINELONE_API_KEY=your_api_token \
SENTINELONE_API_BASE=https://your-tenant.sentinelone.net \
npm start
```

The server exposes a single endpoint: `POST /mcp`

Authenticate via `Authorization: Bearer <token>` header or `?token=<token>` query parameter.

### Docker

```bash
docker build -t sentinelone-mcp-server .
docker run -p 8080:8080 \
  -e MCP_TRANSPORT=http \
  -e MCP_PORT=8080 \
  -e MCP_AUTH_TOKEN=your-secret-token \
  -e SENTINELONE_API_KEY=your_api_token \
  -e SENTINELONE_API_BASE=https://your-tenant.sentinelone.net \
  sentinelone-mcp-server
```

### Cloud Run

```bash
gcloud run deploy sentinelone-mcp-server \
  --source . \
  --region us-central1 \
  --set-env-vars MCP_TRANSPORT=http,MCP_AUTH_TOKEN=your-secret-token,SENTINELONE_API_KEY=your_api_token,SENTINELONE_API_BASE=https://your-tenant.sentinelone.net
```

Cloud Run sets `PORT` automatically; the server uses `MCP_PORT` or `PORT` as fallback.

## Tools Reference

### Threats

| Tool | Description |
|------|-------------|
| `s1_list_threats` | List threats with classification, status, verdict, site, and group filters |
| `s1_get_threat` | Get threat details including hashes, file path, and storyline |
| `s1_mitigate_threat` | Kill, quarantine, remediate, or rollback a threat |

### Agents

| Tool | Description |
|------|-------------|
| `s1_list_agents` | List agents with OS, status, infection, site, and group filters |
| `s1_get_agent` | Get agent details including version, site, and network info |
| `s1_isolate_agent` | Network isolate an endpoint (maintains S1 communication) |
| `s1_reconnect_agent` | Remove network isolation from an agent |

### Alerts

| Tool | Description |
|------|-------------|
| `s1_list_alerts` | Query unified alerts via GraphQL with severity and verdict filters |

### Intelligence

| Tool | Description |
|------|-------------|
| `s1_hash_reputation` | SHA1 or SHA256 hash reputation lookup via Deep Visibility fleet hunt |

### Deep Visibility

| Tool | Description |
|------|-------------|
| `s1_dv_query` | Run a Deep Visibility query with automatic status polling |
| `s1_dv_get_events` | Retrieve events from a completed DV query |

### Sites

| Tool | Description |
|------|-------------|
| `s1_list_sites` | List sites with state, type, SKU, and account filters |
| `s1_get_site` | Get site details including licenses, expiration, and account info |

### Activities

| Tool | Description |
|------|-------------|
| `s1_list_activities` | List activity log entries with type, site, agent, and time filters |
| `s1_list_activity_types` | List all available activity types with IDs and descriptions |

### Exclusions

| Tool | Description |
|------|-------------|
| `s1_list_exclusions` | List exclusions (whitelisted paths, hashes, certificates, file types) |
| `s1_list_blocklist` | List blocklist entries (explicitly blocked hashes and paths) |

### Groups

| Tool | Description |
|------|-------------|
| `s1_list_groups` | List groups with site, type, and name filters |
| `s1_get_group` | Get group details including agent count, policy, and registration token |

### Applications

| Tool | Description |
|------|-------------|
| `s1_list_app_risks` | List application vulnerabilities (CVEs) by severity, exploit status, mitigation |
| `s1_list_app_inventory` | List installed applications with vendor and endpoint counts |

### Device Control

| Tool | Description |
|------|-------------|
| `s1_list_device_control_events` | Monitor USB, Bluetooth, Thunderbolt, SDCard device events |

### Ranger

| Tool | Description |
|------|-------------|
| `s1_list_ranger_inventory` | Discover managed/unmanaged network devices with IP, MAC, OS details |

### Tags & IOCs

| Tool | Description |
|------|-------------|
| `s1_list_tags` | List firewall, network-quarantine, or device-inventory tags |
| `s1_list_iocs` | List threat intelligence IOCs by type, severity, and source |

<details>
<summary>Full parameter reference</summary>

### s1_list_threats
| Parameter | Type | Description |
|-----------|------|-------------|
| `computerName` | string | Search by computer/endpoint name (partial match) |
| `threatName` | string | Search by threat name (partial match) |
| `limit` | number | Max results (default 25, max 1000) |
| `mitigationStatuses` | string[] | Filter: not_mitigated, mitigated, marked_as_benign |
| `classifications` | string[] | Filter: Malware, PUA, Suspicious |
| `analystVerdicts` | string[] | Filter: true_positive, false_positive, suspicious, undefined |
| `siteIds` | string[] | Filter by site IDs |
| `groupIds` | string[] | Filter by group IDs |
| `cursor` | string | Pagination cursor from previous response |

### s1_get_threat
| Parameter | Type | Description |
|-----------|------|-------------|
| `threatId` | string | The threat ID to retrieve |

### s1_mitigate_threat
| Parameter | Type | Description |
|-----------|------|-------------|
| `threatId` | string | The threat ID to mitigate |
| `action` | string | kill, quarantine, remediate, rollback-remediation |

### s1_list_agents
| Parameter | Type | Description |
|-----------|------|-------------|
| `computerName` | string | Search by computer name (partial match) |
| `limit` | number | Max results (default 25, max 1000) |
| `osTypes` | string[] | Filter by OS: windows, macos, linux |
| `isActive` | boolean | Filter by active status |
| `isInfected` | boolean | Filter by infected status |
| `networkStatuses` | string[] | Filter: connected, disconnected |
| `siteIds` | string[] | Filter by site IDs |
| `groupIds` | string[] | Filter by group IDs |
| `cursor` | string | Pagination cursor from previous response |

### s1_get_agent
| Parameter | Type | Description |
|-----------|------|-------------|
| `agentId` | string | The agent ID to retrieve |

### s1_isolate_agent / s1_reconnect_agent
| Parameter | Type | Description |
|-----------|------|-------------|
| `agentId` | string | The agent ID |

### s1_list_alerts
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max results (default 20, max 1000) |
| `cursor` | string | Pagination cursor from previous response |
| `severity` | string | Filter: Low, Medium, High, Critical |
| `analystVerdict` | string | Filter: TruePositive, FalsePositive, Suspicious, Undefined |
| `incidentStatus` | string | Filter: Unresolved, InProgress, Resolved |
| `siteIds` | string[] | Filter by site IDs |
| `storylineId` | string | Filter by storyline ID (correlate with threat) |

### s1_hash_reputation
| Parameter | Type | Description |
|-----------|------|-------------|
| `hash` | string | SHA1 (40 chars) or SHA256 (64 chars) hash |

### s1_dv_query
| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | string | Deep Visibility query (e.g., ProcessName Contains "python") |
| `fromDate` | string | Start date in ISO format |
| `toDate` | string | End date in ISO format |
| `siteIds` | string[] | Filter by site IDs |
| `groupIds` | string[] | Filter by group IDs |
| `accountIds` | string[] | Filter by account IDs |

### s1_dv_get_events
| Parameter | Type | Description |
|-----------|------|-------------|
| `queryId` | string | Query ID from s1_dv_query |
| `limit` | number | Max results (default 50, max 100) |
| `cursor` | string | Pagination cursor |

### s1_list_sites
| Parameter | Type | Description |
|-----------|------|-------------|
| `nameContains` | string[] | Filter by site name (partial match, multiple values) |
| `query` | string | Full-text search across name, account name, and description |
| `state` | string | Filter: active, deleted, expired |
| `siteType` | string | Filter: Paid or Trial |
| `sku` | string | Filter: core, control, complete |
| `accountIds` | string[] | Filter by account IDs |
| `siteIds` | string[] | Filter by site IDs |
| `sortBy` | string | Sort by: name, state, siteType, createdAt, expiration, activeLicenses, totalLicenses |
| `sortOrder` | string | Sort direction: asc or desc |
| `limit` | number | Max results (default 25, max 1000) |
| `cursor` | string | Pagination cursor from previous response |

### s1_get_site
| Parameter | Type | Description |
|-----------|------|-------------|
| `siteId` | string | The site ID to retrieve |

### s1_list_activities
| Parameter | Type | Description |
|-----------|------|-------------|
| `activityTypes` | number[] | Filter by activity type IDs (integers) |
| `siteIds` | string[] | Filter by site IDs |
| `accountIds` | string[] | Filter by account IDs |
| `agentIds` | string[] | Filter by agent IDs |
| `threatIds` | string[] | Filter by threat IDs |
| `createdAt__gt` | string | Activities created after this datetime (ISO 8601) |
| `createdAt__lt` | string | Activities created before this datetime (ISO 8601) |
| `sortBy` | string | Sort by: createdAt, activityType |
| `sortOrder` | string | Sort direction: asc or desc |
| `limit` | number | Max results (default 25, max 100) |
| `cursor` | string | Pagination cursor from previous response |

### s1_list_activity_types

No parameters. Returns all available activity types with IDs and description templates.

### s1_list_exclusions
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Exclusion type: path, white_hash, certificate, file_type, browser |
| `osTypes` | string[] | Filter by OS: windows, linux, macos |
| `siteIds` | string[] | Filter by site IDs |
| `query` | string | Full-text search across exclusion values |
| `value__contains` | string | Filter by value (partial match) |
| `limit` | number | Max results (default 25, max 100) |
| `cursor` | string | Pagination cursor from previous response |

### s1_list_blocklist
| Parameter | Type | Description |
|-----------|------|-------------|
| `siteIds` | string[] | Filter by site IDs |
| `osTypes` | string[] | Filter by OS: windows, linux, macos |
| `query` | string | Full-text search across blocklist values |
| `value__contains` | string | Filter by value (partial match) |
| `limit` | number | Max results (default 25, max 100) |
| `cursor` | string | Pagination cursor from previous response |

### s1_list_groups
| Parameter | Type | Description |
|-----------|------|-------------|
| `siteIds` | string[] | Filter by site IDs |
| `type` | string | Filter by type: static, dynamic, pinned |
| `query` | string | Full-text search across group names |
| `name` | string | Filter by exact group name |
| `limit` | number | Max results (default 25, max 100) |
| `cursor` | string | Pagination cursor from previous response |

### s1_get_group
| Parameter | Type | Description |
|-----------|------|-------------|
| `groupId` | string | The group ID to retrieve |

### s1_list_app_risks
| Parameter | Type | Description |
|-----------|------|-------------|
| `siteIds` | string[] | Filter by site IDs |
| `accountIds` | string[] | Filter by account IDs |
| `severities` | string[] | Filter by severity: critical, high, medium, low |
| `cveId__contains` | string | Filter by CVE ID (partial match) |
| `applicationNames` | string[] | Filter by application names |
| `exploitedInTheWild` | boolean | Filter for CVEs exploited in the wild |
| `mitigationStatus` | string | Filter by mitigation status |
| `sortBy` | string | Sort by: riskScore, severity, applicationName |
| `sortOrder` | string | Sort direction: asc or desc |
| `limit` | number | Max results (default 25, max 100) |
| `cursor` | string | Pagination cursor from previous response |

### s1_list_app_inventory
| Parameter | Type | Description |
|-----------|------|-------------|
| `siteIds` | string[] | Filter by site IDs |
| `name__contains` | string | Filter by application name (partial match) |
| `vendor__contains` | string | Filter by vendor name (partial match) |
| `osTypes` | string[] | Filter by OS: windows, linux, macos |
| `limit` | number | Max results (default 25, max 100) |
| `cursor` | string | Pagination cursor from previous response |

### s1_list_device_control_events
| Parameter | Type | Description |
|-----------|------|-------------|
| `siteIds` | string[] | Filter by site IDs |
| `interfaces` | string[] | Filter by interface: USB, Bluetooth, Thunderbolt, SDCard |
| `eventTypes` | string[] | Filter by event types |
| `agentIds` | string[] | Filter by agent IDs |
| `eventTime__gt` | string | Events after this datetime (ISO 8601) |
| `eventTime__lt` | string | Events before this datetime (ISO 8601) |
| `query` | string | Full-text search across device control events |
| `limit` | number | Max results (default 25, max 100) |
| `cursor` | string | Pagination cursor from previous response |

### s1_list_ranger_inventory
| Parameter | Type | Description |
|-----------|------|-------------|
| `siteIds` | string[] | Filter by site IDs |
| `managedStates` | string[] | Filter: managed, unmanaged, notManageable |
| `deviceTypes` | string[] | Filter by device types |
| `osTypes` | string[] | Filter by OS: windows, linux, macos |
| `query` | string | Full-text search across ranger inventory |
| `localIp__contains` | string | Filter by local IP (partial match) |
| `macAddress__contains` | string | Filter by MAC address (partial match) |
| `hostnames__contains` | string | Filter by hostname (partial match) |
| `firstSeen__gt` | string | Devices first seen after this datetime (ISO 8601) |
| `lastSeen__gt` | string | Devices last seen after this datetime (ISO 8601) |
| `limit` | number | Max results (default 25, max 100) |
| `cursor` | string | Pagination cursor from previous response |

### s1_list_tags
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | **Required.** Tag type: firewall, network-quarantine, device-inventory |
| `siteIds` | string[] | Filter by site IDs |
| `query` | string | Full-text search across tag names |
| `name__contains` | string | Filter by tag name (partial match) |
| `limit` | number | Max results (default 25, max 100) |
| `cursor` | string | Pagination cursor from previous response |

### s1_list_iocs
| Parameter | Type | Description |
|-----------|------|-------------|
| `siteIds` | string[] | Filter by site IDs |
| `type` | string | IOC type: DNS, IPV4, URL, SHA1, SHA256, MD5 |
| `value` | string | Filter by IOC value |
| `severity` | string | Filter by severity |
| `source` | string | Filter by source |
| `creator__contains` | string | Filter by creator (partial match) |
| `name__contains` | string | Filter by IOC name (partial match) |
| `creationTime__gt` | string | IOCs created after this datetime (ISO 8601) |
| `creationTime__lt` | string | IOCs created before this datetime (ISO 8601) |
| `limit` | number | Max results (default 25, max 100) |
| `cursor` | string | Pagination cursor from previous response |

</details>

## Troubleshooting

| Error | Fix |
|-------|-----|
| Configuration error | Ensure SENTINELONE_API_KEY and SENTINELONE_API_BASE are set |
| HTTP 401 | API token expired or invalid — regenerate in S1 console |
| HTTP 403 | Token lacks permissions for this endpoint |
| Request timeout | S1 API took >30s — try narrowing your query filters |
| Tools not appearing | Verify path in `~/.mcp.json`, restart Claude Code |

Check MCP logs: `~/.cache/claude-cli-nodejs/*/mcp-logs-sentinelone/`

## License

MIT
