import { sendJson } from "../../src/server/http.js";

const SESSION_COOKIE = "bws_session";

// Ends the browser session by expiring the session cookie. The cookie is
// HttpOnly, so the page cannot clear it itself; this route is the only way
// to sign out. It is public in the middleware so that signing out works even
// after the cookie has already expired.
export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { ok: false, error: "method_not_allowed" });
    return;
  }
  const parts = [`${SESSION_COOKIE}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (process.env.VERCEL) parts.push("Secure");
  response.setHeader("Set-Cookie", parts.join("; "));
  response.setHeader("Cache-Control", "no-store");
  sendJson(response, 200, { ok: true });
}
