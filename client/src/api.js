// Same-origin /api by default; set VITE_API_BASE (e.g. https://api.example.com/api) when hosting the API separately
const BASE = (import.meta.env && import.meta.env.VITE_API_BASE) || "/api";

export const getToken = () => localStorage.getItem("vouch_token");
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem("vouch_user")); } catch { return null; }
};
export const saveSession = ({ token, user }) => {
  localStorage.setItem("vouch_token", token);
  localStorage.setItem("vouch_user", JSON.stringify(user));
};
export const clearSession = () => {
  localStorage.removeItem("vouch_token");
  localStorage.removeItem("vouch_user");
};

async function request(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { ...opts, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res;
}

export const getJson = async (path) => (await request(path)).json();
export const postJson = async (path, body) =>
  (await request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();
export const postForm = async (path, form) => (await request(path, { method: "POST", body: form })).json();
export const getBlob = async (path) => (await request(path)).blob();
