# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-02-22

### Added
- 14 new tools (25 total):
  - `s1_list_sites` — List sites with state, type, SKU, and license filters
  - `s1_get_site` — Get site details including licenses, expiration, and account info
  - `s1_list_activities` — List activity log entries with type, site, agent, and time filters
  - `s1_list_activity_types` — List all available activity types with IDs and descriptions
  - `s1_list_exclusions` — List exclusions (whitelisted paths, hashes, certificates, file types)
  - `s1_list_blocklist` — List blocklist entries (explicitly blocked hashes and paths)
  - `s1_list_groups` — List groups with site, type, and name filters
  - `s1_get_group` — Get group details including agent count, policy, and registration token
  - `s1_list_app_risks` — List application vulnerabilities (CVEs) by severity and exploit status
  - `s1_list_app_inventory` — List installed applications with vendor and endpoint counts
  - `s1_list_device_control_events` — Monitor USB, Bluetooth, Thunderbolt, SDCard events
  - `s1_list_ranger_inventory` — Discover managed/unmanaged network devices
  - `s1_list_tags` — List firewall, network-quarantine, or device-inventory tags
  - `s1_list_iocs` — List threat intelligence IOCs by type, severity, and source
- HTTP transport mode (`MCP_TRANSPORT=http`) with bearer token auth
- Docker support with multi-stage build
- Cloud Run deployment support (`PORT` env var fallback)

### Changed
- `s1_list_threats`: Added `siteIds`, `groupIds`, `cursor`, `analystVerdicts` params; raised max limit to 1000; default results per page raised from 10 to 25
- `s1_list_agents`: Added `siteIds`, `groupIds`, `cursor` params; raised max limit to 1000; default results per page raised from 10 to 25
- `s1_list_alerts`: Raised max limit to 1000
- `s1_list_sites`: Raised max limit to 1000
- All list tools now show totalItems count and pagination cursor in responses

## [1.0.0] - 2026-02-14

### Added
- Initial release
- SentinelOne REST API client with API key authentication
- GraphQL client for Unified Alerts with edge/node pagination
- 11 MCP tools for SentinelOne integration:
  - `s1_list_threats` - List threats with classification, status, and computer filters
  - `s1_get_threat` - Get threat details including hashes, file path, and storyline
  - `s1_mitigate_threat` - Kill, quarantine, remediate, or rollback threats
  - `s1_list_agents` - List agents with OS, status, and infection filters
  - `s1_get_agent` - Get agent details including version, site, and network info
  - `s1_isolate_agent` - Network isolate an endpoint
  - `s1_reconnect_agent` - Remove network isolation
  - `s1_list_alerts` - Query unified alerts via GraphQL with severity and verdict filters
  - `s1_hash_reputation` - SHA1/SHA256 hash reputation lookup
  - `s1_dv_query` - Run Deep Visibility queries with automatic polling
  - `s1_dv_get_events` - Retrieve Deep Visibility query results with pagination
- API key sanitization in error messages
- Configurable via environment variables (SENTINELONE_API_KEY, SENTINELONE_API_BASE)
