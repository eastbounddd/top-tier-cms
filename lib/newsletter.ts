export const MAILCHIMP_ACTION = "https://toptierstate.us18.list-manage.com/subscribe/post?u=d74e761f7f05ede1718912346&id=0a37f9d12b&f_id=000aa4e6f0";
export const MAILCHIMP_HONEYPOT = "b_d74e761f7f05ede1718912346_0a37f9d12b";

export type NewsletterResult = {
  status: "success" | "pending" | "subscribed" | "error";
  message: string;
  fallback?: boolean;
};

// Never render upstream HTML or treat HTTP 200 alone as a confirmed signup.
export function parseMailchimpResponse(body: string): NewsletterResult {
  const match = body.trim().match(/^newsletter\(([\s\S]*)\);?$/);
  const data = JSON.parse(match ? match[1] : body);
  if (typeof data.msg !== "string") throw new Error("Unexpected response");
  if (data.result === "success") {
    if (/confirm|activation|verify|check your|sent you/i.test(data.msg)) {
      return { status: "pending", message: "Almost there! Check your inbox to confirm your signup." };
    }
    return { status: "success", message: "You're in! Welcome to Top Tier." };
  }
  if (data.result !== "error") throw new Error("Unexpected response");
  if (/already subscribed/i.test(data.msg)) {
    return { status: "subscribed", message: "You're already on the list. Thanks for being part of Top Tier!" };
  }
  return { status: "error", message: "We couldn't complete your signup. Try again or continue securely with Mailchimp.", fallback: true };
}
