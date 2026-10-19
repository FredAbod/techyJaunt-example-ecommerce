export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const formatPrice = (price) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(price / 100);

export async function api(path, { method = "GET", body, token } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
}

export function nairaToKobo(input) {
  const cleaned = String(input).trim();
  if (!/^\d+$/.test(cleaned)) return null;
  const naira = Number(cleaned);
  if (!Number.isSafeInteger(naira)) return null;
  const kobo = naira * 100;
  return Number.isSafeInteger(kobo) ? kobo : null;
}

export async function startGoogleSignIn() {
  const { url } = await api("/api/v1/auth/google");
  window.location.assign(url);
}
