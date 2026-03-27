async function parseJson(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/** Set `VITE_API_ORIGIN` in `.env.production` when the API is on another host/port (e.g. http://138.197.176.173:8082). */
function apiUrl(path) {
  const base = String(import.meta.env.VITE_API_ORIGIN || "").trim().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export async function apiGet(path) {
  const r = await fetch(apiUrl(path));
  const data = await parseJson(r);
  if (!r.ok) throw new Error(data.error || `${r.status} ${r.statusText}`);
  return data;
}

export async function apiSend(method, path, body) {
  const r = await fetch(apiUrl(path), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await parseJson(r);
  if (!r.ok) throw new Error(data.error || `${r.status} ${r.statusText}`);
  return data;
}

export async function apiSendFormData(method, path, formData) {
  const r = await fetch(apiUrl(path), {
    method,
    body: formData,
  });
  const data = await parseJson(r);
  if (!r.ok) throw new Error(data.error || `${r.status} ${r.statusText}`);
  return data;
}
