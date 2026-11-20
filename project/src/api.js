const TOKEN_KEY = "skillforge-token";
const USER_KEY = "skillforge-user";

export function getAuthSnapshot() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? `${token}:${localStorage.getItem(USER_KEY) || ""}` : null;
}

export function subscribeAuth(callback) {
  const onStorage = (event) => {
    if (event.key === TOKEN_KEY || event.key === USER_KEY || event.key === null) callback();
  };
  window.addEventListener("skillforge-auth-change", callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("skillforge-auth-change", callback);
    window.removeEventListener("storage", onStorage);
  };
}

function notifyAuthChange() {
  window.dispatchEvent(new Event("skillforge-auth-change"));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyAuthChange();
}

export function saveStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyAuthChange();
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthChange();
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let response;
  try {
    response = await fetch(`/api${path}`, { ...options, headers });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Cannot connect to the backend. Please start the server.", { cause: error });
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json().catch(() => ({})) : {};

  if (response.status === 401) {
    if (token) {
      clearSession();
      throw new Error("Your session has expired. Please sign in again.");
    }
    throw new Error(data.message || "Please sign in to continue.");
  }

  if (!response.ok) {
    if (response.status >= 500 && !data.message) {
      throw new Error("Cannot connect to the backend. Please start the server.");
    }
    throw new Error(data.message || "The request could not be completed.");
  }

  return data;
}
