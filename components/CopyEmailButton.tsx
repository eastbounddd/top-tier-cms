"use client";

import { useEffect, useRef, useState } from "react";

export function CopyEmailButton({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const reset = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (reset.current) clearTimeout(reset.current); }, []);

  async function copy() {
    if (reset.current) clearTimeout(reset.current);
    try {
      await navigator.clipboard.writeText(email);
      setMessage("Copied ✓");
    } catch {
      const input = document.createElement("textarea");
      input.value = email;
      input.style.cssText = "position:fixed;inset:0;opacity:0";
      const focused = document.activeElement;
      document.body.append(input);
      input.select();
      try {
        setMessage(document.execCommand("copy") ? "Copied ✓" : "Copy unavailable");
      } catch {
        setMessage("Copy unavailable");
      } finally {
        input.remove();
        if (focused instanceof HTMLElement) focused.focus();
      }
    }
    reset.current = setTimeout(() => setMessage(""), 2000);
  }

  return <button type="button" className="advertise-secondary" onClick={copy} aria-live="polite">{message || "Copy Email"}</button>;
}
