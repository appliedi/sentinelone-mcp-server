# Changelog

All notable changes to this project will be documented in this file.

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
