async function parseJson(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function apiUrl(path) {
  const base = String(import.meta.env.VITE_API_ORIGIN || "").trim().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

async function apiRequest(path, options) {
  const response = await fetch(apiUrl(path), options);
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || `${response.status} ${response.statusText}`);
  return data;
}

export function apiGet(path) {
  return apiRequest(path);
}

export async function apiSend(method, path, body) {
  return apiRequest(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export function apiSendFormData(method, path, formData) {
  return apiRequest(path, {
    method,
    body: formData,
  });
}
