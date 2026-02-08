import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Authenticated API request wrapper.
 * Automatically injects the Supabase JWT into the Authorization header.
 * On 401, redirects to /login.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  } else {
    console.warn("[apiRequest] No session token available for", path);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401) {
    // Token expired or invalid — redirect to login
    await supabase.auth.signOut();
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    // Handle FastAPI validation errors (detail is an array)
    let message: string;
    if (Array.isArray(error.detail)) {
      message = error.detail.map((e: { msg?: string; loc?: string[] }) => {
        const field = e.loc?.slice(-1)[0] || "";
        return field ? `${field}: ${e.msg}` : e.msg || "Validation error";
      }).join("; ");
    } else if (typeof error.detail === "string") {
      message = error.detail;
    } else {
      message = `API error: ${response.status}`;
    }
    throw new Error(message);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * SSE streaming fetch with auth headers.
 * Uses ReadableStream instead of EventSource to support Authorization header.
 */
export async function fetchSSE(
  url: string,
  onEvent: (event: Record<string, unknown>) => void,
  onError?: (error: Error) => void
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`SSE error: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            onEvent(JSON.parse(line.slice(6)));
          } catch {
            /* skip malformed event */
          }
        }
      }
    }
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error(String(error)));
  }
}
