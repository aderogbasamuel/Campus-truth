import { createHash, timingSafeEqual } from "node:crypto";

export async function authenticateCronRequest(request: Request): Promise<Response | null> {
  const secret = process.env["CRON_SECRET"];
  if (!secret) return new Response("Server configuration error", { status: 500 });

  const token = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return new Response("Unauthorized", { status: 401 });

  const digest = (v: string) => createHash("sha256").update(v, "utf8").digest();
  if (!timingSafeEqual(digest(token), digest(secret))) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}