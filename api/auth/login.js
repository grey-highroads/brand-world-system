const SESSION_COOKIE = "bws_session";

export default function handler(request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  return request.json().then(({ username, password }) => {
    const expected = process.env.BRAND_WORLD_ACCESS_PASSWORD;
    if (!expected) {
      return new Response(JSON.stringify({ ok: false, error: "not_configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (username === "brandworld" && password === expected) {
      const token = btoa("brandworld:" + expected);
      const cookie = [
        `${SESSION_COOKIE}=${token}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=86400",
        process.env.VERCEL ? "Secure" : "",
      ].filter(Boolean).join("; ");

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
          "Cache-Control": "no-store",
        },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "invalid" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  });
}
