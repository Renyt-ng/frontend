import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

/**
 * Shared Axios instance for all backend API calls.
 * Token is injected per-request by the interceptor or manually.
 */
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

/** Set bearer token for authenticated requests */
export function setAuthToken(token: string) {
  apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

/** Clear bearer token on logout */
export function clearAuthToken() {
  delete apiClient.defaults.headers.common["Authorization"];
}

export default apiClient;
