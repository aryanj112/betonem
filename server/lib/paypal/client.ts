/**
 * PayPal API Client
 * Handles authentication, token caching, and API requests
 */

interface AccessTokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: AccessTokenCache | null = null;

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  throw new Error("Missing PayPal environment variables: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are required");
}

/**
 * Get OAuth access token from PayPal
 * Caches token until expiry (with 60s buffer)
 */
export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) {
    return tokenCache.token;
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  try {
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PayPal token request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const expiresIn = data.expires_in || 32400; // Default 9 hours if not provided

    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (expiresIn - 60) * 1000, // Cache until 60s before expiry
    };

    return tokenCache.token;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to get PayPal access token");
  }
}

/**
 * Make an authenticated request to PayPal API
 */
export async function paypalRequest<T = unknown>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  headers?: Record<string, string>
): Promise<T> {
  const token = await getAccessToken();

  const url = path.startsWith("http") ? path : `${PAYPAL_BASE_URL}${path}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...headers,
  };

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204 || response.status === 201) {
      // For 201, try to parse but allow empty
      const text = await response.text();
      if (!text) {
        return {} as T;
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        return {} as T;
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorBody: unknown;
      try {
        errorBody = JSON.parse(errorText);
      } catch {
        errorBody = errorText;
      }

      // Don't log sensitive tokens/secrets
      const safeError = errorBody && typeof errorBody === "object"
        ? JSON.stringify(errorBody).replace(/("access_token"|"client_id"|"client_secret"):"[^"]+"/gi, '$1:"***"')
        : errorText;

      throw new Error(`PayPal API error (${response.status}): ${safeError}`);
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof Error) {
      // Don't log sensitive data in error messages
      const message = error.message.replace(/(access_token|client_id|client_secret)=[^\s&]+/gi, '$1=***');
      throw new Error(`PayPal request failed: ${message}`);
    }
    throw new Error("PayPal request failed");
  }
}

/**
 * Clear token cache (useful for testing or forced refresh)
 */
export function clearTokenCache(): void {
  tokenCache = null;
}
