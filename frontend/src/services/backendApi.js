
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000"
)
  .replace(/\/+$/, "")
  .replace(/(?:\/api\/v1)+$/i, "");

export function apiUrl(endpoint) {
  const normalizedEndpoint = endpoint
    .replace(/^(?:\/api\/v1)+(?=\/|$)/i, "")
    .replace(/^\/+/, "");
  return `${API_BASE_URL}/${normalizedEndpoint}`;
}

async function request(endpoint, options = {}) {
  const response = await fetch(
    apiUrl(endpoint),
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

    chat: (token, message, options = {}) =>
      request("/chat", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          history: options.history || [],
          language: options.language || "en",
          role: options.role || "parent",
          page: options.page || "",
        }),
      }),
};
