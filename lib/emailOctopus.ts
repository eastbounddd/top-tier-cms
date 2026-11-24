import { createHash } from "node:crypto";

type ListField = { label: string; tag: string };
type FieldTags = { firstName?: string; lastName?: string; consent: string };
let cachedTags: { listUrl: string; tags: FieldTags; expires: number } | undefined;

async function getFieldTags(listUrl: string, options: RequestInit): Promise<FieldTags> {
  if (cachedTags?.listUrl === listUrl && cachedTags.expires > Date.now()) return cachedTags.tags;

  const result = await fetch(listUrl, options);
  if (!result.ok) throw new Error(`List lookup failed (${result.status})`);
  const { fields } = await result.json();
  if (!Array.isArray(fields)) throw new Error("List field metadata is missing");

  const findTag = (name: string) => fields.find((field: ListField) =>
    typeof field?.tag === "string" && [field.label, field.tag].some(value =>
      typeof value === "string" && value.toLowerCase().replace(/[\s_-]/g, "") === name
    )
  )?.tag;
  const consent = findTag("consent");
  if (!consent) throw new Error("List Consent field is missing");
  const tags = { firstName: findTag("firstname"), lastName: findTag("lastname"), consent };
  cachedTags = { listUrl, tags, expires: Date.now() + 5 * 60_000 };
  return tags;
}

export async function subscribeWithEmailOctopus(email: string, firstName: string, lastName: string) {
  const key = process.env.EMAILOCTOPUS_API_KEY?.trim();
  const listId = process.env.EMAILOCTOPUS_LIST_ID?.trim();
  if (!key || !listId) throw new Error("EmailOctopus credentials are missing");

  const listUrl = `https://api.emailoctopus.com/lists/${encodeURIComponent(listId)}`;
  const contacts = `${listUrl}/contacts`;
  const contactId = createHash("md5").update(email).digest("hex");
  const contactUrl = `${contacts}/${contactId}`;
  const options: RequestInit = {
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  };

  const tags = await getFieldTags(listUrl, options);
  const fields: Record<string, string> = { [tags.consent]: "yes" };
  if (firstName && !tags.firstName || lastName && !tags.lastName) {
    throw new Error("Requested name field is missing on the list");
  }
  if (firstName && tags.firstName) fields[tags.firstName] = firstName;
  if (lastName && tags.lastName) fields[tags.lastName] = lastName;

  async function isSubscribed() {
    const result = await fetch(contactUrl, options);
    if (result.status === 404) return false;
    if (!result.ok) throw new Error(`Contact lookup failed (${result.status})`);
    return (await result.json()).status === "subscribed";
  }

  const alreadySubscribed = await isSubscribed();
  const result = await fetch(contacts, {
    ...options,
    method: "PUT",
    body: JSON.stringify({ email_address: email, fields, status: "subscribed" }),
  });
  if (result.status === 409 && await isSubscribed()) return true;
  if (!result.ok) throw new Error(`Contact upsert failed (${result.status})`);
  if ((await result.json()).status !== "subscribed") throw new Error("Contact was not subscribed");
  return alreadySubscribed;
}
