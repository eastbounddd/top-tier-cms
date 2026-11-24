export const newsletterEndpoint = "/api/newsletter";
export const newsletterHoneypot = "website";

export type NewsletterResult = {
  status: "success" | "subscribed" | "error";
  message: string;
};
