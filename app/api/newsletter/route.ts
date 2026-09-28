import { NextResponse } from "next/server";
import { MAILCHIMP_ACTION, MAILCHIMP_HONEYPOT, parseMailchimpResponse } from "@/lib/newsletter";

const reply = (data: object, status = 200) => NextResponse.json(data, {
  status, headers: { "Cache-Control": "no-store" },
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return reply({ status: "error", message: "Please sign up from Top Tier State." }, 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return reply({ status: "error", message: "Invalid request." }, 415);
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
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return reply({ status: "error", message: "Invalid request. Please try again." }, 400);
  }
  const email = typeof input?.EMAIL === "string" ? input.EMAIL.trim() : "";
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply({ status: "error", message: "Please enter a valid email address." }, 400);
  }
  if (input[MAILCHIMP_HONEYPOT]) {
    return reply({ status: "error", message: "We couldn't complete your signup." }, 400);
  }
  try {
    // Public embed transport: fixed audience, no API credentials required.
    const url = new URL(MAILCHIMP_ACTION);
    url.pathname = "/subscribe/post-json";
    url.searchParams.set("c", "newsletter");
    url.searchParams.set("EMAIL", email);
    url.searchParams.set(MAILCHIMP_HONEYPOT, "");
    const response = await fetch(url, {
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("Mailchimp unavailable");
    return reply(parseMailchimpResponse(await response.text()));
  } catch {
    // Do not log subscriber emails or upstream URLs containing them.
    return reply({ status: "error", message: "We couldn't confirm your signup. Please try again or continue securely with Mailchimp.", fallback: true }, 502);
  }
}
