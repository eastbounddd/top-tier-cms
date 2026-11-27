export const publicArticles = () =>
  `status.eq.published,and(status.eq.scheduled,published_at.lte.${new Date(Math.floor(Date.now() / 60000) * 60000).toISOString()})`;

export const canPublish = (role?: string) => ["owner", "editor", "admin"].includes(role || "");

export const chicagoDate = (value: string) => {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value)) return null;
  const target = Date.parse(value + "Z");
  const format = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Chicago", dateStyle: "short", timeStyle: "short",
  });
  for (const offset of [5, 6]) {
    const date = new Date(target + offset * 3600000);
    if (Number.isFinite(date.getTime()) && format.format(date).replace(" ", "T") === value) return date.toISOString();
  }
  return null;
};
