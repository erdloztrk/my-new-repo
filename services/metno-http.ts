/**
 * MET Norway HTTP Client
 * Handles User-Agent requirements and caching headers
 */

import { logDebug, logError } from "@/lib/logger";

const USER_AGENT = "LokalApp/1.0 (contact: oztrkerdl@gmail.com)";

export interface MetHttpResponse<T = any> {
  status: number;
  json?: T;
  headers: {
    expires?: string;
    lastModified?: string;
    xErrorClass?: string;
  };
}

export interface MetHttpOptions {
  ifModifiedSince?: string;
}

/**
 * Fetch JSON from MET API with proper headers
 */
export async function fetchMetJson<T = any>(
  url: string,
  options: MetHttpOptions = {}
): Promise<MetHttpResponse<T>> {
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    "Accept": "application/json",
  };

  if (options.ifModifiedSince) {
    headers["If-Modified-Since"] = options.ifModifiedSince;
  }

  try {
    logDebug(`[MetHttp] Fetching: ${url}`);
    const response = await fetch(url, { headers });

    // Extract headers
    const expires = response.headers.get("Expires") || undefined;
    const lastModified = response.headers.get("Last-Modified") || undefined;
    const xErrorClass = response.headers.get("X-ErrorClass") || undefined;

    // Handle 304 Not Modified
    if (response.status === 304) {
      logDebug(`[MetHttp] 304 Not Modified for: ${url}`);
      return {
        status: 304,
        headers: {
          expires,
          lastModified,
          xErrorClass,
        },
      };
    }

    // Handle errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      logError(`[MetHttp] Error ${response.status} for ${url}: ${errorText}`);
      throw new Error(`MET API error: ${response.status} - ${errorText}`);
    }

    // Parse JSON
    const json = await response.json();

    return {
      status: response.status,
      json,
      headers: {
        expires,
        lastModified,
        xErrorClass,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      logError(`[MetHttp] Fetch error for ${url}:`, error.message);
      throw error;
    }
    throw new Error(`Unknown error fetching ${url}`);
  }
}

