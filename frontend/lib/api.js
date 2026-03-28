/**
 * Nanoneuron CRM — API client
 * In production: NEXT_PUBLIC_API_URL = https://api.nanoneuron.ai
 * In development: falls back to http://localhost:8000
 */
export const API_BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:8000";

export function apiFetch(path, opts = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : "";
  const headers = { "Content-Type": "application/json", ...opts.headers };
  if (token) headers["Authorization"] = "Bearer " + token;
  return fetch(API_BASE + "/api" + path, { ...opts, headers }).then((r) =>
    r.json()
  );
}
