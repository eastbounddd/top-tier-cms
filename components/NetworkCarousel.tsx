"use client";

import { useEffect, useRef } from "react";

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
  ["Top Tier SMU","toptiersmu"],
  ["Top Tier Vols","TopTierVols"],
  ["Top Tier LSU","toptierlsu"],
  ["Top Tier Florida State","toptiernoles"],
  ["Top Tier South Carolina","toptierusc"],
  ["Top Tier Michigan","toptieruofm"],
  ["Top Tier Texas A&M","toptiertexasam"],
  ["Top Tier Jacksonville St","toptiercocks"],
  ["Top Tier BYU","toptiercougs"],
  ["Top Tier Clemson","TopTierCU"],
  ["Top Tier Nebraska","TopTierHuskers"],
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
  ["Top Tier Mizzou","TopTierMizzou"],
] as const;

const doubledAccounts = [...accounts, ...accounts] as const;

export function NetworkCarousel() {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const scrubber = useRef<HTMLInputElement>(null);
  const paused = useRef(false);
  const touching = useRef(false);
  const scrollPosition = useRef(0);
  const loopDistance = useRef(0);
  const desktopTransform = useRef(false);
  const reducedMotion = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let frame = 0;
    let previous = performance.now();
    let lastScrubberUpdate = 0;
    const el = viewport.current;
    const row = track.current;
    if (!el || !row) return;

    const desktopQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const measureLoop = () => {
      const cards = row.querySelectorAll<HTMLElement>(".network-card");
      const first = cards[0];
      const duplicate = cards[accounts.length];
      loopDistance.current = first && duplicate
        ? duplicate.offsetLeft - first.offsetLeft
        : row.scrollWidth / 2;
    };

    const paintPosition = () => {
      if (desktopTransform.current) {
        row.style.transform = `translate3d(${-scrollPosition.current}px,0,0)`;
      } else {
        el.scrollLeft = scrollPosition.current;
      }
    };

    const syncPreferences = () => {
      const wasDesktop = desktopTransform.current;
      desktopTransform.current = desktopQuery.matches;
      reducedMotion.current = motionQuery.matches;

      if (!wasDesktop && desktopTransform.current) {
        scrollPosition.current = el.scrollLeft;
        el.scrollLeft = 0;
      } else if (wasDesktop && !desktopTransform.current) {
        row.style.transform = "";
      }

      paintPosition();
    };

    measureLoop();
    syncPreferences();
    const resizeObserver = new ResizeObserver(() => {
      measureLoop();
      const midpoint = loopDistance.current;
      if (midpoint > 0) scrollPosition.current %= midpoint;
      paintPosition();
    });
    resizeObserver.observe(row);
    const addQueryListener = (query: MediaQueryList) => {
      if (query.addEventListener) query.addEventListener("change", syncPreferences);
      else query.addListener(syncPreferences);
    };
    const removeQueryListener = (query: MediaQueryList) => {
      if (query.removeEventListener) query.removeEventListener("change", syncPreferences);
      else query.removeListener(syncPreferences);
    };
    addQueryListener(desktopQuery);
    addQueryListener(motionQuery);

    const tick = (now: number) => {
      if (!paused.current && !reducedMotion.current) {
        const delta = Math.min(40, now - previous);
        scrollPosition.current += delta * 0.045;

        const midpoint = loopDistance.current;
        if (midpoint > 0 && scrollPosition.current >= midpoint) {
          scrollPosition.current -= midpoint;
        }

        if (midpoint > 0) {
          paintPosition();
          if (scrubber.current && now - lastScrubberUpdate >= 100) {
            scrubber.current.value = String(
              Math.round((scrollPosition.current / midpoint) * 1000)
            );
            lastScrubberUpdate = now;
          }
        }
      }
      previous = now;
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      removeQueryListener(desktopQuery);
      removeQueryListener(motionQuery);
      if (resumeTimer.current !== null) {
        clearTimeout(resumeTimer.current);
      }
    };
  }, []);

  const resumeAfterTouchScroll = (el: HTMLDivElement) => {
    if (desktopTransform.current) {
      paused.current = false;
      return;
    }
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
    const row = track.current;
    if (el && row) {
      const midpoint = loopDistance.current;
      scrollPosition.current = (value / 1000) * midpoint;
      if (desktopTransform.current) {
        row.style.transform = `translate3d(${-scrollPosition.current}px,0,0)`;
      } else {
        el.scrollLeft = scrollPosition.current;
      }
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
        onTouchStart={(event) => {
          if (resumeTimer.current !== null) {
            clearTimeout(resumeTimer.current);
            resumeTimer.current = null;
          }
          touching.current = true;
          paused.current = true;
          scrollPosition.current = event.currentTarget.scrollLeft;
        }}
        onTouchEnd={(event) => {
          touching.current = false;
          resumeAfterTouchScroll(event.currentTarget);
        }}
        onTouchCancel={(event) => {
          touching.current = false;
          resumeAfterTouchScroll(event.currentTarget);
        }}
        onScroll={(event) => {
          if (paused.current && !desktopTransform.current) {
            scrollPosition.current = event.currentTarget.scrollLeft;
            if (!touching.current) {
              resumeAfterTouchScroll(event.currentTarget);
            }
          }
        }}
      >
        <div ref={track} className="network-track">
          {doubledAccounts.map(([name, handle], i) => (
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
          ref={scrubber}
          aria-label="Jump through Top Tier X accounts"
          type="range"
          min="0"
          max="1000"
          defaultValue="0"
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
