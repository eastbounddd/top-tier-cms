export function XAccountLink({ handle, className = "school-x-link", label, compactLabel }: {
  handle: string; className?: string; label?: string; compactLabel?: string;
}) {
  return (
    <a
      className={className}
      href={`https://x.com/${handle}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={compactLabel ? label : label ? undefined : `@${handle} on X`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.967 6.817H1.68l7.73-8.835L1.254 2.25h6.826l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
      </svg>
      <span className={compactLabel ? "x-link-full-label" : undefined}>{label ?? `@${handle}`}</span>
      {compactLabel && <span className="x-link-compact-label">{compactLabel}</span>}
    </a>
  );
}
