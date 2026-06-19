// src/ipAllowlist.ts
import ipaddr from "ipaddr.js";

/** Parse a comma/space separated ALLOWED_IPS string into a clean list. */
export function parseAllowedIps(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
}

/**
 * Extract the real client IP on Cloud Run. Google's front end APPENDS the true
 * client IP as the last `X-Forwarded-For` entry, so we read the rightmost value
 * (left entries are client-supplied and spoofable). Falls back to the socket.
 */
export function getClientIp(req: import("node:http").IncomingMessage): string {
  const xff = req.headers["x-forwarded-for"];
  const header = Array.isArray(xff) ? xff[0] : xff;
  if (header) {
    const parts = header.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.socket?.remoteAddress ?? "";
}

/** True if `clientIp` matches any allowlist entry (exact or CIDR). Empty list = allow all. */
export function isIpAllowed(clientIp: string, allowList: string[]): boolean {
  if (allowList.length === 0) return true;
  let addr: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    addr = ipaddr.process(clientIp); // normalizes IPv4-mapped IPv6 to IPv4
  } catch {
    return false;
  }
  for (const entry of allowList) {
    try {
      if (entry.includes("/")) {
        const cidr = ipaddr.parseCIDR(entry);
        if (addr.kind() === cidr[0].kind() && addr.match(cidr)) return true;
      } else {
        const a = ipaddr.process(entry);
        if (addr.kind() === a.kind() && addr.toNormalizedString() === a.toNormalizedString()) {
          return true;
        }
      }
    } catch {
      // ignore malformed allowlist entry
    }
  }
  return false;
}
