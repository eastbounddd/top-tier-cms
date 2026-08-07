"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const accounts = [
  ["Top Tier","toptierstatex"],
  ["Top Tier Auburn","toptierauburn"],
  ["Top Tier Tulane","toptiertulane"],
  ["Top Tier UCF","toptierucf"],
  ["Top Tier Georgia Tech","toptiergt"],
  ["Top Tier Ohio State","toptierbuckeyes"],
  ["Top Tier Iowa State","toptiercyclones"],
  ["Top Tier Georgia","toptieruga"],
  ["Top Tier Hockey","toptierpucks"],
  ["Top Tier Arkansas","toptierarkansas"],
  ["Top Tier Oklahoma","toptieroklahoma"],
  ["Top Tier Notre Dame","toptiernd"],
  ["Top Tier SMU","toptiersmu"],
  ["Top Tier Tennessee","toptiervols"],
  ["Top Tier LSU","toptierlsu"],
  ["Top Tier Florida State","toptiernoles"],
  ["Top Tier South Carolina","toptierusc"],
  ["Top Tier Michigan","toptieruofm"],
  ["Top Tier Texas A&M","toptiertexasam"],
  ["Top Tier Jacksonville St","toptiercocks"],
  ["Top Tier BYU","toptiercougs"],
  ["Top Tier Baylor","toptierbaylor"],
  ["Top Tier Penn State","toptierpennst"],
  ["Top Tier Mississippi State","toptiermissst"],
  ["Top Tier Florida","toptiergators"],
  ["Top Tier Indiana","toptierindiana"],
  ["Top Tier Texas","toptierut"],
  ["Top Tier Colorado State","toptiercsu"],
  ["Top Tier Delaware","toptierdelaware"],
  ["Top Tier Arizona","toptierarizona"],
  ["Top Tier Alabama","toptieralabama"],
  ["Top Tier Texas Tech","toptierttu"],
  ["Top Tier Virginia Tech","toptierhokies"],
  ["Top Tier Vanderbilt","toptiervandy"],
  ["Top Tier Oklahoma State","toptierosu"],
  ["Top Tier Louisville","toptieruofl"],
  ["Top Tier Miami","miamitate"],
  ["Top Tier Ole Miss","TopTierOleMiss"],
  ["Top Tier SEC","sectoptier"],
  ["Top Tier Utah","toptierutes"],
  ["Top Tier Kentucky","toptierbbn"],
] as const;

export function NetworkCarousel() {
  const viewport = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const touching = useRef(false);
  const scrollPosition = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState(0);
  const doubled = useMemo(() => [...accounts, ...accounts], []);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const el = viewport.current;
      if (el && !paused.current) {
        const delta = Math.min(40, now - previous);
        scrollPosition.current += delta * 0.045;

        const midpoint = el.scrollWidth / 2;
        if (midpoint > 0 && scrollPosition.current >= midpoint) {
          scrollPosition.current -= midpoint;
        }

        if (midpoint > 0) {
          el.scrollLeft = scrollPosition.current;
          setPosition(Math.round((scrollPosition.current / midpoint) * 1000));
        }
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      if (resumeTimer.current !== null) {
        clearTimeout(resumeTimer.current);
      }
    };
  }, []);

  const resumeAfterTouchScroll = (el: HTMLDivElement) => {
    if (resumeTimer.current !== null) {
      clearTimeout(resumeTimer.current);
    }

    // Let native swipe momentum finish before autoplay takes control again.
    resumeTimer.current = setTimeout(() => {
      scrollPosition.current = el.scrollLeft;
      paused.current = false;
      resumeTimer.current = null;
    }, 140);
  };

  const jump = (value: number) => {
    const el = viewport.current;
    setPosition(value);
    if (el) {
      const midpoint = el.scrollWidth / 2;
      scrollPosition.current = (value / 1000) * midpoint;
      el.scrollLeft = scrollPosition.current;
    }
  };

  return (
    <section className="network-section">
      <div className="shell section-row">
        <div>
          <small>THE TOP TIER NETWORK</small>
          <h2>Follow Every Top Tier Account</h2>
        </div>
      </div>

      <div
        ref={viewport}
        className="network-viewport"
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") paused.current = true;
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") paused.current = false;
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse") {
            if (resumeTimer.current !== null) {
              clearTimeout(resumeTimer.current);
              resumeTimer.current = null;
            }
            touching.current = true;
            paused.current = true;
            scrollPosition.current = event.currentTarget.scrollLeft;
          }
        }}
        onPointerUp={(event) => {
          if (event.pointerType !== "mouse") {
            touching.current = false;
            resumeAfterTouchScroll(event.currentTarget);
          }
        }}
        onPointerCancel={(event) => {
          if (event.pointerType !== "mouse") {
            touching.current = false;
            resumeAfterTouchScroll(event.currentTarget);
          }
        }}
        onScroll={(event) => {
          if (paused.current) {
            scrollPosition.current = event.currentTarget.scrollLeft;
            if (!touching.current) {
              resumeAfterTouchScroll(event.currentTarget);
            }
          }
        }}
      >
        <div className="network-track">
          {doubled.map(([name, handle], i) => (
            <a
              className="network-card"
              key={`${handle}-${i}`}
              href={`https://x.com/${handle}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`${name} on X`}
            >
              <img
                src={`/api/x-avatar?handle=${encodeURIComponent(handle)}`}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/top-tier-logo.png";
                }}
                alt={`${name} profile logo`}
                loading="lazy"
              />
              <b>{name}</b>
              <span>@{handle}</span>
            </a>
          ))}
        </div>
      </div>

      <div className="shell scrub">
        <span>DRAG TO JUMP</span>
        <input
          aria-label="Jump through Top Tier X accounts"
          type="range"
          min="0"
          max="1000"
          value={position}
          onPointerDown={() => {
            paused.current = true;
          }}
          onPointerUp={() => {
            paused.current = false;
          }}
          onPointerCancel={() => {
            paused.current = false;
          }}
          onBlur={() => {
            paused.current = false;
          }}
          onChange={(e) => jump(Number(e.target.value))}
        />
      </div>
    </section>
  );
}
