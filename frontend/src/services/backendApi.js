
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : `Request failed (${response.status})`
    );
  }

  return data;
}

export const backendApi = {
  health: () => request("/health"),

  register: (name, email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    }),

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    }),

  getProfile: (token) =>
    request("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  getChildren: (token) =>
    request("/children", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

    getAssignedChildren: (token) =>
  request("/worker/children", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }),
};
