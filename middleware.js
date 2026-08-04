import { next } from "@vercel/functions";

function authorized(request, password) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(":");
    return separator !== -1 && decoded.slice(0, separator) === "brandworld" && decoded.slice(separator + 1) === password;
  } catch {
    return false;
  }
}

export default function middleware(request) {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/api/blob/upload") return next();
  const password = process.env.BRAND_WORLD_ACCESS_PASSWORD;
  if (!password) {
    return new Response("This Brand World installation still needs its access password configured.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  if (authorized(request, password)) return next();
  return new Response("Enter the Brand World installation password to continue.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Brand World System", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
