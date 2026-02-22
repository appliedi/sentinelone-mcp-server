// Common pagination response
export interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    nextCursor?: string;
    totalItems?: number;
  };
}

// Threat types
export interface Threat {
  id: string;
  agentId: string;
  agentComputerName: string;
  agentOsType: string;
  classification: string;
  classificationSource: string;
  confidenceLevel: string;
  createdAt: string;
  description: string;
  fileContentHash: string;
  filePath: string;
  initiatedBy: string;
  initiatedByDescription: string;
  mitigationStatus: string;
  threatName: string;
  storylineId: string;
  threatInfo?: {
    sha1?: string;
    sha256?: string;
    md5?: string;
    filePath?: string;
    fileSize?: number;
  };
}

export type MitigationAction =
  | "kill"
  | "quarantine"
  | "remediate"
  | "rollback-remediation";

// Agent types
export interface Agent {
  id: string;
  uuid: string;
  computerName: string;
  domain: string;
  siteName: string;
  groupName: string;
  osName: string;
  osType: string;
  agentVersion: string;
  isActive: boolean;
  isDecommissioned: boolean;
  infected: boolean;
  networkStatus: string;
  lastActiveDate: string;
  externalIp: string;
  networkInterfaces: Array<{
    inet: string[];
    physical: string;
    name: string;
  }>;
}

// Deep Visibility types
export interface DVQueryResponse {
  queryId: string;
  status: string;
}

export interface DVEvent {
  id: string;
  eventType: string;
  eventTime: string;
  agentId: string;
  agentName: string;
  processName: string;
  processImagePath?: string;
  processCommandLine?: string;
  processUser?: string;
  parentProcessName?: string;
  srcIp?: string;
  dstIp?: string;
  dstPort?: number;
  filePath?: string;
  sha1?: string;
  sha256?: string;
  registryPath?: string;
  registryValue?: string;
  dnsRequest?: string;
  url?: string;
}

export interface DVQueryStatus {
  queryId: string;
  status: "RUNNING" | "FINISHED" | "FAILED" | "CANCELED";
  progressStatus?: number;
  responseError?: string;
}

// GraphQL Alert types
export interface Alert {
  alertId: string;
  severity: string;
  analystVerdict: string;
  incidentStatus: string;
  threatName: string;
  classification: string;
  storylineId: string;
  agentId: string;
  agentName: string;
  siteName: string;
  createdAt: string;
  updatedAt: string;
}

// Site types
export interface Site {
  id: string;
  name: string;
  state: string;
  siteType: string;
  sku: string;
  accountId: string;
  accountName: string;
  activeLicenses: number;
  totalLicenses: number;
  createdAt: string;
  updatedAt: string;
  expiration: string;
  isDefault: boolean;
  description: string;
  externalId: string;
  creator: string;
  creatorId: string;
  unlimitedExpiration: boolean;
  unlimitedLicenses: boolean;
}

export interface SitesResponse {
  data: {
    allSites: {
      activeLicenses: number;
      totalLicenses: number;
    };
    sites: Site[];
  };
  pagination?: {
    nextCursor?: string;
    totalItems?: number;
  };
}

export interface SingleSiteResponse {
  data: Site;
}

// Activity types
export interface Activity {
  id: string;
  activityType: number;
  primaryDescription: string;
  secondaryDescription: string;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  siteId: string;
  siteName: string;
  accountId: string;
  accountName: string;
  agentId: string;
  agentUpdatedVersion: string;
  userId: string;
  threatId: string;
  groupId: string;
}

export interface ActivityType {
  id: number;
  action: string;
  descriptionTemplate: string;
}

// Exclusion types
export interface Exclusion {
  id: string;
  type: string;
  value: string;
  osType: string;
  mode: string;
  source: string;
  scopeName: string;
  scopePath: string;
  description: string;
  userName: string;
  userId: string;
  siteIds: string[];
  groupIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Group types
export interface Group {
  id: string;
  name: string;
  siteId: string;
  siteName: string;
  type: string;
  rank: number;
  totalAgents: number;
  isDefault: boolean;
  inherits: boolean;
  creator: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  filterId: string;
  filterName: string;
  registrationToken: string;
}

export interface SingleGroupResponse {
  data: Group;
}

// Application Risk types
export interface AppRisk {
  id: string;
  cveId: string;
  severity: string;
  riskScore: number;
  applicationName: string;
  applicationVendor: string;
  exploitedInTheWild: boolean;
  mitigationStatus: string;
  detailedDescription: string;
  publishedDate: string;
  affectedEndpointsCount: number;
}

// Application Inventory types
export interface AppInventoryItem {
  id: string;
  applicationName: string;
  applicationVendor: string;
  osType: string;
  endpointsCount: number;
  applicationVersionsCount: number;
  riskLevel: string;
  installedDate: string;
}

// Tag types
export interface Tag {
  id: string;
  name: string;
  type: string;
  kind: string;
  description: string;
  scopeId: string;
  scopeName: string;
  createdAt: string;
  updatedAt: string;
}

// Device Control types
export interface DeviceControlEvent {
  id: string;
  agentId: string;
  eventType: string;
  eventTime: string;
  interface: string;
  accessPermission: string;
  vendorId: string;
  productId: string;
  deviceName: string;
  deviceClass: string;
  ruleName: string;
  computerName: string;
  siteName: string;
  siteId: string;
}

// Ranger types
export interface RangerDevice {
  id: string;
  localIp: string;
  externalIp: string;
  macAddress: string;
  osName: string;
  osType: string;
  deviceType: string;
  managedState: string;
  manufacturer: string;
  hostnames: string[];
  firstSeen: string;
  lastSeen: string;
  siteId: string;
  siteName: string;
  networkName: string;
}

// IOC types
export interface IOC {
  id: string;
  type: string;
  value: string;
  severity: string;
  source: string;
  name: string;
  description: string;
  category: string;
  method: string;
  creator: string;
  creationTime: string;
  updatedAt: string;
  externalId: string;
  validUntil: string;
}

// API Error response
export interface ApiError {
  errors?: Array<{
    code: number;
    detail: string;
    title: string;
  }>;
}
