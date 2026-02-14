import { getConfig } from "../config.js";
import { sanitizeError } from "../utils.js";
import type { Alert } from "./types.js";

const TIMEOUT_MS = 30000;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    path?: string[];
  }>;
}

interface AlertEdge {
  node: Alert;
}

interface AlertsQueryResponse {
  alerts: {
    edges: AlertEdge[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor?: string;
    };
  };
}

// GraphQL filter format: { fieldId, stringEqual: { value } }
interface AlertFilter {
  fieldId: string;
  stringEqual?: { value: string };
  stringIn?: { values: string[] };
}

export async function queryAlerts(params?: {
  limit?: number;
  cursor?: string;
  severity?: string;
  analystVerdict?: string;
  incidentStatus?: string;
  siteIds?: string[];
  storylineId?: string;
}): Promise<{
  alerts: Alert[];
  pageInfo: { hasNextPage: boolean; endCursor?: string };
}> {
  const config = getConfig();
  const url = `${config.apiBase}/web/api/v2.1/unifiedalerts/graphql`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  // Build filters array with correct syntax: { fieldId, stringEqual: { value } }
  const filters: AlertFilter[] = [];

  if (params?.severity) {
    filters.push({ fieldId: "severity", stringEqual: { value: params.severity } });
  }
  if (params?.analystVerdict) {
    filters.push({
      fieldId: "analystVerdict",
      stringEqual: { value: params.analystVerdict },
    });
  }
  if (params?.incidentStatus) {
    filters.push({
      fieldId: "status",
      stringEqual: { value: params.incidentStatus },
    });
  }
  if (params?.storylineId) {
    filters.push({ fieldId: "storylineId", stringEqual: { value: params.storylineId } });
  }
  if (params?.siteIds?.length) {
    filters.push({ fieldId: "siteId", stringIn: { values: params.siteIds } });
  }

  // Correct schema: "alerts" query with edges/node pattern
  const query = `query GetAlerts($first: Int, $after: String, $filters: [FilterInput!]) {
  alerts(first: $first, after: $after, filters: $filters) {
    edges {
      node {
        id
        severity
        analystVerdict
        name
        classification
        confidenceLevel
        status
        storylineId
        detectedAt
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}`;

  const variables = {
    first: params?.limit ?? 20,
    after: params?.cursor,
    filters: filters.length > 0 ? filters : undefined,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `ApiToken ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `HTTP ${response.status}: ${response.statusText} - ${errorBody}`
      );
    }

    const result = (await response.json()) as GraphQLResponse<AlertsQueryResponse>;

    if (result.errors?.length) {
      throw new Error(
        `GraphQL errors: ${result.errors.map((e) => e.message).join(", ")}`
      );
    }

    if (!result.data?.alerts) {
      throw new Error("No data returned from GraphQL query");
    }

    // Transform edges/node to flat alerts array
    const alerts = result.data.alerts.edges.map((edge) => edge.node);

    return {
      alerts,
      pageInfo: result.data.alerts.pageInfo,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${TIMEOUT_MS}ms`);
    }
    throw new Error(sanitizeError(error));
  } finally {
    clearTimeout(timeoutId);
  }
}
