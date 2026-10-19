// frontend/src/api.js

const BASE_URL =
  process.env.REACT_APP_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

export async function api(path, { method = "GET", token, body } = {}) {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    // Network-level failure (backend down, wrong port, CORS, etc.)
    throw new Error(
      `Failed to fetch (backend unreachable). Is your backend running on ${BASE_URL}?`
    );
  }

  // Try to parse JSON, but don't crash if backend returns empty/HTML
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }

  if (!res.ok) {
    const msg =
      (data && data.error) ||
      (data && data.message) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}