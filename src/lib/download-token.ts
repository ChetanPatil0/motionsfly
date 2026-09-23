/**
 * Universal utility to create clean, masked, URL-safe download codes
 * Compatible across both Node.js server runtimes and browser client bundles.
 */

function toUrlSafe(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return base64;
}

export function encodeDownloadCode(token: string, orderNumber?: string): string {
  const payload = orderNumber ? `${token}:${orderNumber}` : token;
  try {
    if (typeof window === "undefined" && typeof Buffer !== "undefined") {
      return toUrlSafe(Buffer.from(payload, "utf-8").toString("base64"));
    }
    // Safe browser base64 encoding
    return toUrlSafe(btoa(unescape(encodeURIComponent(payload))));
  } catch {
    // Fallback if encoding encounters unexpected string
    return payload;
  }
}

export function decodeDownloadCode(code: string): { token: string; orderNumber?: string } {
  try {
    const base64 = fromUrlSafe(code);
    let raw = "";

    if (typeof window === "undefined" && typeof Buffer !== "undefined") {
      raw = Buffer.from(base64, "base64").toString("utf-8");
    } else {
      raw = decodeURIComponent(escape(atob(base64)));
    }

    if (raw.includes(":")) {
      const parts = raw.split(":");
      return { token: parts[0] || "", orderNumber: parts.slice(1).join(":") };
    }
    return { token: raw };
  } catch {
    return { token: code };
  }
}
