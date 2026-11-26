"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function MobileNavigation({ links }: { links: readonly (readonly [string, string])[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !wrapper.current?.contains(event.target)) setIsOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      toggle.current?.focus();
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [isOpen]);

  return <div className="editorial-mobile-nav" ref={wrapper}>
    <button type="button" ref={toggle} className="editorial-menu-toggle"
      aria-expanded={isOpen} aria-label={isOpen ? "Close menu" : "Open menu"} aria-controls="editorial-mobile-menu"
      onClick={() => setIsOpen(open => !open)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d={isOpen ? "M6 6l12 12M18 6L6 18" : "M4 6h16M4 12h16M4 18h16"} />
      </svg>
    </button>
    <nav id="editorial-mobile-menu" aria-label="Mobile navigation" hidden={!isOpen}>
      {links.map(([href, label]) => <Link key={href} href={href} onClick={() => setIsOpen(false)}>{label}</Link>)}
    </nav>
  </div>;
}
