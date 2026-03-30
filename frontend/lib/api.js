/**
 * Nanoneuron CRM — API client
 * In production: NEXT_PUBLIC_API_URL = https://nanoneuron-api-production-287b.up.railway.app
 * In development: falls back to http://localhost:8000
 */
const RAILWAY_URL = "https://nanoneuron-api-production-287b.up.railway.app";

export const API_BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? RAILWAY_URL
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
