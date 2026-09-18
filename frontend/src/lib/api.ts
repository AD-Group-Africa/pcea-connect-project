import axios from "axios"
const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080" })
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = "Bearer " + token
    }
  }
  return config
})

/**
 * Pulls the human-readable message out of an API error.
 * The backend returns `{ success: false, message: "..." }` with the right HTTP
 * status, so prefer that over axios' generic "Request failed with status code…".
 * Falls back to a caller-provided message when there is no server detail
 * (network failure, unreachable backend, non-JSON error body).
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const response = (error as { response?: { data?: unknown } }).response
    if (response && typeof response.data === "object" && response.data !== null) {
      const message = (response.data as { message?: unknown }).message
      if (typeof message === "string" && message.trim()) return message
    }
  }
  return fallback
}

export default api
