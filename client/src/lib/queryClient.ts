import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Auth endpoints where 401/403 should NOT trigger redirect
const AUTH_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-otp",
  "/api/auth/resend-otp",
];

async function throwIfResNotOk(res: Response, url?: string) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Check if this is an auth endpoint - don't redirect, just throw error
    const isAuthEndpoint = url && AUTH_ENDPOINTS.some(endpoint => url.includes(endpoint));
    
    if (isAuthEndpoint) {
      // For auth endpoints, just throw the error message without redirecting
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || errorData.error || "Authentication failed");
      } catch (e) {
        if (e instanceof SyntaxError) {
          throw new Error(text || "Authentication failed");
        }
        throw e;
      }
    }
    
    // Handle disabled user - auto logout on 403 with access denied message
    if (res.status === 403 && text.includes("Access denied")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      throw new Error("Access denied. Please contact administrator.");
    }
    
    // Handle token expired or unauthorized - auto logout on 401
    if (res.status === 401 || text.toLowerCase().includes("unauthorized") || text.toLowerCase().includes("token expired") || text.toLowerCase().includes("jwt expired")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
      throw new Error("Session expired. Please login again.");
    }
    
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to get token
function getToken(): string | null {
  return localStorage.getItem("token");
}

// Main API request function
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const headers: Record<string, string> = {};

  // Set Content-Type for non-GET requests
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  // Add Authorization header if token exists
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res, url);
  return res.json();
}

// Query function factory
type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};

    // Add Authorization header if token exists
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Query client with error handling
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
