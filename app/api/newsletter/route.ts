import { NextResponse } from "next/server";
import { isIP } from "node:net";
import { subscribeWithEmailOctopus } from "@/lib/emailOctopus";
import { newsletterHoneypot, type NewsletterResult } from "@/lib/newsletter";

const reply = (data: NewsletterResult, status = 200, headers = {}) => NextResponse.json(data, {
  status, headers: { "Cache-Control": "no-store", ...headers },
});

const attemptsByIp = new Map<string, { count: number; expires: number }>();
const rateWindow = 10 * 60_000;
const rateLimit = 5;

function retryAfter(request: Request) {
  const clientIp = request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for");
  const ip = clientIp && isIP(clientIp) ? clientIp : "unknown";
  const now = Date.now();
  const bucket = attemptsByIp.get(ip);
  if (bucket && bucket.expires > now) {
    if (bucket.count >= rateLimit) return Math.ceil((bucket.expires - now) / 1000);
    bucket.count++;
    return 0;
  }
  if (attemptsByIp.size >= 4096) {
    for (const [key, entry] of attemptsByIp) {
      if (entry.expires <= now) attemptsByIp.delete(key);
    }
    if (attemptsByIp.size >= 4096) return 60;
  }
  attemptsByIp.set(ip, { count: 1, expires: now + rateWindow });
  return 0;
}

function validEmail(email: string) {
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(email)) return false;
  const [local, domain] = email.split("@");
  return local.length <= 64 && !/^\.|\.$|\.\./.test(local) &&
    !/^(.)\1{11,}$/.test(local) && !/\.(?:invalid|test|localhost)$/.test(domain);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return reply({ status: "error", message: "Please sign up from Top Tier State." }, 403);
  }
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json" && contentType !== "application/x-www-form-urlencoded") {
    return reply({ status: "error", message: "Invalid request." }, 415);
  }
  const wait = retryAfter(request);
  if (wait) {
    return reply({ status: "error", message: "Too many signup attempts. Please try again later." }, 429, { "Retry-After": String(wait) });
  }
  let input;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Empty request");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2048) {
        await reader.cancel();
        return reply({ status: "error", message: "Request too large." }, 413);
      }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks).toString("utf8");
    input = contentType === "application/json" ? JSON.parse(body) : Object.fromEntries(new URLSearchParams(body));
  } catch {
    return reply({ status: "error", message: "Invalid request. Please try again." }, 400);
  }
  if (input?.[newsletterHoneypot]) {
    return reply({ status: "error", message: "We couldn't complete your signup." }, 400);
  }
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!validEmail(email)) {
    return reply({ status: "error", message: "Please enter a valid email address." }, 400);
  }
  const names: unknown[] = [input.firstName ?? "", input.lastName ?? ""];
  if (!names.every((name): name is string =>
    typeof name === "string" && name.trim().length <= 100 && !/[\x00-\x1f\x7f]/.test(name)
  )) {
    return reply({ status: "error", message: "Please enter valid names of 100 characters or fewer." }, 400);
  }

  try {
    const alreadySubscribed = await subscribeWithEmailOctopus(email, names[0].trim(), names[1].trim());
    return reply(alreadySubscribed
      ? { status: "subscribed", message: "You're already subscribed." }
      : { status: "success", message: "You're in! Watch your inbox for Top Tier Weekly." });
  } catch {
    return reply({ status: "error", message: "We couldn't confirm your signup. Please try again." }, 502);
  }
}
