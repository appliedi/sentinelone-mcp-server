import { getConfig } from "../config.js";
import { sanitizeError } from "../utils.js";
import type {
  PaginatedResponse,
  Threat,
  Agent,
  DVQueryResponse,
  DVQueryStatus,
  DVEvent,
  MitigationAction,
  SitesResponse,
  SingleSiteResponse,
  Activity,
  ActivityType,
  Exclusion,
  Group,
  SingleGroupResponse,
  AppRisk,
  AppInventoryItem,
  Tag,
  DeviceControlEvent,
  RangerDevice,
  IOC,
} from "./types.js";

const TIMEOUT_MS = 30000;

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getConfig();
  const url = `${config.apiBase}/web/api/v2.1${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `ApiToken ${config.apiKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${errorBody}`
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${TIMEOUT_MS}ms`);
    }
    throw new Error(sanitizeError(error));
  } finally {
    clearTimeout(timeoutId);
  }
}

// Threats API
export async function listThreats(params?: {
  limit?: number;
  cursor?: string;
  siteIds?: string[];
  groupIds?: string[];
  resolved?: boolean;
  mitigationStatuses?: string[];
  classifications?: string[];
  analystVerdicts?: string[];
  computerNameContains?: string;
  threatNameContains?: string;
}): Promise<PaginatedResponse<Threat>> {
  const searchParams = new URLSearchParams();

  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.siteIds?.length)
    searchParams.set("siteIds", params.siteIds.join(","));
  if (params?.groupIds?.length)
    searchParams.set("groupIds", params.groupIds.join(","));
  if (params?.resolved !== undefined)
    searchParams.set("resolved", String(params.resolved));
  if (params?.mitigationStatuses?.length)
    searchParams.set("mitigationStatuses", params.mitigationStatuses.join(","));
  if (params?.classifications?.length)
    searchParams.set("classifications", params.classifications.join(","));
  if (params?.analystVerdicts?.length)
    searchParams.set("analystVerdicts", params.analystVerdicts.join(","));
  if (params?.computerNameContains)
    searchParams.set("computerName__contains", params.computerNameContains);
  if (params?.threatNameContains)
    searchParams.set("threatDetails__contains", params.threatNameContains);

  const query = searchParams.toString();
  return request<PaginatedResponse<Threat>>(
    `/threats${query ? `?${query}` : ""}`
  );
}

export async function getThreat(
  threatId: string
): Promise<PaginatedResponse<Threat>> {
  const searchParams = new URLSearchParams({ ids: threatId });
  return request<PaginatedResponse<Threat>>(`/threats?${searchParams.toString()}`);
}

export async function mitigateThreat(
  threatId: string,
  action: MitigationAction
): Promise<{ data: { affected: number } }> {
  return request<{ data: { affected: number } }>(
    `/threats/mitigate/${action}`,
    {
      method: "POST",
      body: JSON.stringify({
        filter: { ids: [threatId] },
      }),
    }
  );
}

// Agents API
export async function listAgents(params?: {
  limit?: number;
  cursor?: string;
  siteIds?: string[];
  groupIds?: string[];
  computerNameContains?: string;
  osTypes?: string[];
  isActive?: boolean;
  isInfected?: boolean;
  networkStatuses?: string[];
}): Promise<PaginatedResponse<Agent>> {
  const searchParams = new URLSearchParams();

  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.siteIds?.length)
    searchParams.set("siteIds", params.siteIds.join(","));
  if (params?.groupIds?.length)
    searchParams.set("groupIds", params.groupIds.join(","));
  if (params?.computerNameContains)
    searchParams.set("computerName__contains", params.computerNameContains);
  if (params?.osTypes?.length)
    searchParams.set("osTypes", params.osTypes.join(","));
  if (params?.isActive !== undefined)
    searchParams.set("isActive", String(params.isActive));
  if (params?.isInfected !== undefined)
    searchParams.set("isInfected", String(params.isInfected));
  if (params?.networkStatuses?.length)
    searchParams.set("networkStatuses", params.networkStatuses.join(","));

  const query = searchParams.toString();
  return request<PaginatedResponse<Agent>>(`/agents${query ? `?${query}` : ""}`);
}

export async function getAgent(
  agentId: string
): Promise<PaginatedResponse<Agent>> {
  const searchParams = new URLSearchParams({ ids: agentId });
  return request<PaginatedResponse<Agent>>(`/agents?${searchParams.toString()}`);
}

export async function isolateAgent(
  agentId: string
): Promise<{ data: { affected: number } }> {
  return request<{ data: { affected: number } }>(
    "/agents/actions/disconnect",
    {
      method: "POST",
      body: JSON.stringify({
        filter: { ids: [agentId] },
      }),
    }
  );
}

export async function reconnectAgent(
  agentId: string
): Promise<{ data: { affected: number } }> {
  return request<{ data: { affected: number } }>("/agents/actions/connect", {
    method: "POST",
    body: JSON.stringify({
      filter: { ids: [agentId] },
    }),
  });
}

// Deep Visibility API
export async function createDVQuery(params: {
  query: string;
  fromDate: string;
  toDate: string;
  siteIds?: string[];
  groupIds?: string[];
  accountIds?: string[];
}): Promise<DVQueryResponse> {
  const response = await request<{ data: DVQueryResponse }>(
    "/dv/init-query",
    {
      method: "POST",
      body: JSON.stringify({
        query: params.query,
        fromDate: params.fromDate,
        toDate: params.toDate,
        ...(params.siteIds?.length && { siteIds: params.siteIds }),
        ...(params.groupIds?.length && { groupIds: params.groupIds }),
        ...(params.accountIds?.length && { accountIds: params.accountIds }),
      }),
    }
  );
  return response.data;
}

export async function getDVQueryStatus(
  queryId: string
): Promise<DVQueryStatus> {
  const response = await request<{ data: DVQueryStatus }>(
    `/dv/query-status?${new URLSearchParams({ queryId }).toString()}`
  );
  return response.data;
}

export async function getDVEvents(params: {
  queryId: string;
  limit?: number;
  cursor?: string;
}): Promise<PaginatedResponse<DVEvent>> {
  const searchParams = new URLSearchParams();
  searchParams.set("queryId", params.queryId);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.cursor) searchParams.set("cursor", params.cursor);

  return request<PaginatedResponse<DVEvent>>(
    `/dv/events?${searchParams.toString()}`
  );
}

// Sites API
export async function listSites(params?: {
  limit?: number;
  cursor?: string;
  siteIds?: string[];
  accountIds?: string[];
  nameContains?: string[];
  query?: string;
  state?: string;
  states?: string[];
  siteType?: string;
  sku?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<SitesResponse> {
  const searchParams = new URLSearchParams();

  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.siteIds?.length)
    searchParams.set("siteIds", params.siteIds.join(","));
  if (params?.accountIds?.length)
    searchParams.set("accountIds", params.accountIds.join(","));
  if (params?.nameContains?.length)
    searchParams.set("name__contains", params.nameContains.join(","));
  if (params?.query) searchParams.set("query", params.query);
  if (params?.state) searchParams.set("state", params.state);
  if (params?.states?.length)
    searchParams.set("states", params.states.join(","));
  if (params?.siteType) searchParams.set("siteType", params.siteType);
  if (params?.sku) searchParams.set("sku", params.sku);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();
  return request<SitesResponse>(`/sites${query ? `?${query}` : ""}`);
}

export async function getSite(siteId: string): Promise<SingleSiteResponse> {
  return request<SingleSiteResponse>(`/sites/${encodeURIComponent(siteId)}`);
}

// Activities API
export async function listActivities(params?: {
  limit?: number;
  cursor?: string;
  activityTypes?: number[];
  siteIds?: string[];
  accountIds?: string[];
  agentIds?: string[];
  threatIds?: string[];
  createdAt__gt?: string;
  createdAt__lt?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<PaginatedResponse<Activity>> {
  const searchParams = new URLSearchParams();

  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.activityTypes?.length)
    searchParams.set("activityTypes", params.activityTypes.join(","));
  if (params?.siteIds?.length)
    searchParams.set("siteIds", params.siteIds.join(","));
  if (params?.accountIds?.length)
    searchParams.set("accountIds", params.accountIds.join(","));
  if (params?.agentIds?.length)
    searchParams.set("agentIds", params.agentIds.join(","));
  if (params?.threatIds?.length)
    searchParams.set("threatIds", params.threatIds.join(","));
  if (params?.createdAt__gt)
    searchParams.set("createdAt__gt", params.createdAt__gt);
  if (params?.createdAt__lt)
    searchParams.set("createdAt__lt", params.createdAt__lt);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();
  return request<PaginatedResponse<Activity>>(
    `/activities${query ? `?${query}` : ""}`
  );
}

export async function listActivityTypes(): Promise<{ data: ActivityType[] }> {
  return request<{ data: ActivityType[] }>("/activities/types");
}

// Exclusions API
export async function listExclusions(params?: {
  limit?: number;
  cursor?: string;
  type?: string;
  osTypes?: string[];
  siteIds?: string[];
  query?: string;
  value__contains?: string;
}): Promise<PaginatedResponse<Exclusion>> {
  const searchParams = new URLSearchParams();

  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.type) searchParams.set("type", params.type);
  if (params?.osTypes?.length)
    searchParams.set("osTypes", params.osTypes.join(","));
  if (params?.siteIds?.length)
    searchParams.set("siteIds", params.siteIds.join(","));
  if (params?.query) searchParams.set("query", params.query);
  if (params?.value__contains)
    searchParams.set("value__contains", params.value__contains);

  const query = searchParams.toString();
  return request<PaginatedResponse<Exclusion>>(
    `/exclusions${query ? `?${query}` : ""}`
  );
}

// Restrictions (Blocklist) API
export async function listRestrictions(params?: {
  limit?: number;
  cursor?: string;
  siteIds?: string[];
  osTypes?: string[];
  query?: string;
  value__contains?: string;
}): Promise<PaginatedResponse<Exclusion>> {
  const searchParams = new URLSearchParams();

  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.siteIds?.length)
    searchParams.set("siteIds", params.siteIds.join(","));
  if (params?.osTypes?.length)
    searchParams.set("osTypes", params.osTypes.join(","));
  if (params?.query) searchParams.set("query", params.query);
  if (params?.value__contains)
    searchParams.set("value__contains", params.value__contains);

  const query = searchParams.toString();
  return request<PaginatedResponse<Exclusion>>(
    `/restrictions${query ? `?${query}` : ""}`
  );
}

// Groups API
export async function listGroups(params?: {
  limit?: number;
  cursor?: string;
  siteIds?: string[];
  type?: string;
  query?: string;
  name?: string;
}): Promise<PaginatedResponse<Group>> {
  const searchParams = new URLSearchParams();

  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.siteIds?.length)
    searchParams.set("siteIds", params.siteIds.join(","));
  if (params?.type) searchParams.set("type", params.type);
  if (params?.query) searchParams.set("query", params.query);
  if (params?.name) searchParams.set("name", params.name);

  const query = searchParams.toString();
  return request<PaginatedResponse<Group>>(
    `/groups${query ? `?${query}` : ""}`
  );
}

export async function getGroup(groupId: string): Promise<SingleGroupResponse> {
  return request<SingleGroupResponse>(
    `/groups/${encodeURIComponent(groupId)}`
  );
}

// Application Management API
export async function listAppRisks(params?: {
  limit?: number;
  cursor?: string;
  siteIds?: string[];
  accountIds?: string[];
  severities?: string[];
  cveId__contains?: string;
  applicationNames?: string[];
  exploitedInTheWild?: boolean;
  mitigationStatus?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<PaginatedResponse<AppRisk>> {
  const searchParams = new URLSearchParams();

  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.siteIds?.length)
    searchParams.set("siteIds", params.siteIds.join(","));
  if (params?.accountIds?.length)
    searchParams.set("accountIds", params.accountIds.join(","));
  if (params?.severities?.length)
    searchParams.set("severities", params.severities.join(","));
  if (params?.cveId__contains)
    searchParams.set("cveId__contains", params.cveId__contains);
  if (params?.applicationNames?.length)
    searchParams.set("applicationNames", params.applicationNames.join(","));
  if (params?.exploitedInTheWild !== undefined)
    searchParams.set("exploitedInTheWild", String(params.exploitedInTheWild));
  if (params?.mitigationStatus)
    searchParams.set("mitigationStatus", params.mitigationStatus);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();
  return request<PaginatedResponse<AppRisk>>(
    `/application-management/risks${query ? `?${query}` : ""}`
  );
}

export async function listAppInventory(params?: {
  limit?: number;
  cursor?: string;
  siteIds?: string[];
  name__contains?: string;
  vendor__contains?: string;
  osTypes?: string[];
}): Promise<PaginatedResponse<AppInventoryItem>> {
  const searchParams = new URLSearchParams();

  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.siteIds?.length)
    searchParams.set("siteIds", params.siteIds.join(","));
  if (params?.name__contains)
    searchParams.set("name__contains", params.name__contains);
  if (params?.vendor__contains)
    searchParams.set("vendor__contains", params.vendor__contains);
  if (params?.osTypes?.length)
    searchParams.set("osTypes", params.osTypes.join(","));

  const query = searchParams.toString();
  return request<PaginatedResponse<AppInventoryItem>>(
    `/application-management/inventory${query ? `?${query}` : ""}`
  );
}

// Tags API
export async function listTags(params: {
  type: string;
  limit?: number;
  cursor?: string;
  siteIds?: string[];
  query?: string;
  name__contains?: string;
}): Promise<PaginatedResponse<Tag>> {
  const searchParams = new URLSearchParams();

  searchParams.set("type", params.type);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.cursor) searchParams.set("cursor", params.cursor);
  if (params.siteIds?.length)
    searchParams.set("siteIds", params.siteIds.join(","));
  if (params.query) searchParams.set("query", params.query);
  if (params.name__contains)
    searchParams.set("name__contains", params.name__contains);

  return request<PaginatedResponse<Tag>>(
    `/tags?${searchParams.toString()}`
  );
}

// Device Control API
export async function listDeviceControlEvents(params?: {
  limit?: number;
  cursor?: string;
  siteIds?: string[];
  interfaces?: string[];
  eventTypes?: string[];
  agentIds?: string[];
  eventTime__gt?: string;
  eventTime__lt?: string;
  query?: string;
}): Promise<PaginatedResponse<DeviceControlEvent>> {
  const searchParams = new URLSearchParams();

  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.siteIds?.length)
    searchParams.set("siteIds", params.siteIds.join(","));
  if (params?.interfaces?.length)
    searchParams.set("serviceClasses", params.interfaces.join(","));
  if (params?.eventTypes?.length)
    searchParams.set("eventTypes", params.eventTypes.join(","));
  if (params?.agentIds?.length)
    searchParams.set("agentIds", params.agentIds.join(","));
  if (params?.eventTime__gt)
    searchParams.set("eventTime__gt", params.eventTime__gt);
  if (params?.eventTime__lt)
    searchParams.set("eventTime__lt", params.eventTime__lt);
  if (params?.query) searchParams.set("query", params.query);

  const query = searchParams.toString();
  return request<PaginatedResponse<DeviceControlEvent>>(
    `/device-control/events${query ? `?${query}` : ""}`
  );
}

// Ranger API
export async function listRangerInventory(params?: {
  limit?: number;
  cursor?: string;
  siteIds?: string[];
  managedStates?: string[];
  deviceTypes?: string[];
  osTypes?: string[];
  query?: string;
  localIp__contains?: string;
  macAddress__contains?: string;
  hostnames__contains?: string;
  firstSeen__gt?: string;
  lastSeen__gt?: string;
}): Promise<PaginatedResponse<RangerDevice>> {
  const searchParams = new URLSearchParams();

  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.siteIds?.length)
    searchParams.set("siteIds", params.siteIds.join(","));
  if (params?.managedStates?.length)
    searchParams.set("managedStates", params.managedStates.join(","));
  if (params?.deviceTypes?.length)
    searchParams.set("deviceTypes", params.deviceTypes.join(","));
  if (params?.osTypes?.length)
    searchParams.set("osTypes", params.osTypes.join(","));
  if (params?.query) searchParams.set("query", params.query);
  if (params?.localIp__contains)
    searchParams.set("localIp__contains", params.localIp__contains);
  if (params?.macAddress__contains)
    searchParams.set("macAddress__contains", params.macAddress__contains);
  if (params?.hostnames__contains)
    searchParams.set("hostnames__contains", params.hostnames__contains);
  if (params?.firstSeen__gt)
    searchParams.set("firstSeen__gt", params.firstSeen__gt);
  if (params?.lastSeen__gt)
    searchParams.set("lastSeen__gt", params.lastSeen__gt);

  const query = searchParams.toString();
  return request<PaginatedResponse<RangerDevice>>(
    `/ranger/table-view${query ? `?${query}` : ""}`
  );
}

// Threat Intelligence API
export async function listIOCs(params?: {
  limit?: number;
  cursor?: string;
  siteIds?: string[];
  type?: string;
  value?: string;
  severity?: string;
  source?: string;
  creator__contains?: string;
  name__contains?: string;
  creationTime__gt?: string;
  creationTime__lt?: string;
}): Promise<PaginatedResponse<IOC>> {
  const searchParams = new URLSearchParams();

  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.cursor) searchParams.set("cursor", params.cursor);
  if (params?.siteIds?.length)
    searchParams.set("siteIds", params.siteIds.join(","));
  if (params?.type) searchParams.set("type", params.type);
  if (params?.value) searchParams.set("value", params.value);
  if (params?.severity) searchParams.set("severity", params.severity);
  if (params?.source) searchParams.set("source", params.source);
  if (params?.creator__contains)
    searchParams.set("creator__contains", params.creator__contains);
  if (params?.name__contains)
    searchParams.set("name__contains", params.name__contains);
  if (params?.creationTime__gt)
    searchParams.set("creationTime__gt", params.creationTime__gt);
  if (params?.creationTime__lt)
    searchParams.set("creationTime__lt", params.creationTime__lt);

  const query = searchParams.toString();
  return request<PaginatedResponse<IOC>>(
    `/threat-intelligence/iocs${query ? `?${query}` : ""}`
  );
}
