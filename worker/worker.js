// Proxy between the GitHub Pages site and SiliconFlow.
// The API key lives only in the SF_KEY secret. The model is pinned by the MODEL variable,
// so a caller cannot switch to a paid model even if it copies requests from the page.

const UPSTREAM = "https://api.siliconflow.cn/v1/chat/completions";
const MAX_BODY_CHARS = 60000;

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "content-type": "application/json" } });
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes(origin);
    const cors = {
      "Access-Control-Allow-Origin": okOrigin ? origin : allowed[0] || "",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
      "Vary": "Origin",
    };

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    // Browsers always send Origin on cross-site fetches; this keeps other sites from embedding the proxy.
    // It does not stop scripts that forge the header, which is why the model is pinned to a free one.
    if (!okOrigin) return json({ error: "origin not allowed" }, 403, cors);

    const { pathname } = new URL(req.url);
    if (pathname === "/health") return json({ ok: Boolean(env.SF_KEY && env.MODEL), model: env.MODEL }, 200, cors);
    if (pathname !== "/chat" || req.method !== "POST") return json({ error: "not found" }, 404, cors);

    const raw = await req.text();
    if (raw.length > MAX_BODY_CHARS) return json({ error: "request too long" }, 413, cors);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ error: "bad json" }, 400, cors); }
    if (!Array.isArray(body.messages)) return json({ error: "messages required" }, 400, cors);

    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: { authorization: `Bearer ${env.SF_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: env.MODEL,
        messages: body.messages,
        tools: Array.isArray(body.tools) ? body.tools.slice(0, 8) : undefined,
        max_tokens: 800,
        temperature: 0.3,
        stream: false,
      }),
    });
    return new Response(await upstream.text(), { status: upstream.status, headers: { ...cors, "content-type": "application/json" } });
  },
};
