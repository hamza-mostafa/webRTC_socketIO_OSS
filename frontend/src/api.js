const API = "http://localhost:4000/api";
export async function post(path, body) {
  const res = await fetch(`http://localhost:4000/api/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}
