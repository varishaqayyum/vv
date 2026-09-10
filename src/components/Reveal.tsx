import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

// TanStack Router's own reactive location state does not reliably update for
// a hash-only change on the *same* route (confirmed by testing: the browser's
// `window.location.hash` genuinely changes when a same-page "About" link is
// clicked, but a hook like `useLocation` never re-fires for it). Since the
// router still updates the URL via `history.pushState` — which never fires a
// native `hashchange` event either — the only reliable, router-agnostic way
// to detect this is to patch `pushState`/`replaceState` once and broadcast a
// custom event, then just read `window.location.hash` directly ourselves.
let historyPatched = false;
function ensureHistoryPatched() {
  if (historyPatched || typeof window === "undefined") return;
  historyPatched = true;
  const dispatch = () => window.dispatchEvent(new Event("statementclinic:locationchange"));
  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);
  window.history.pushState = (...args: Parameters<typeof originalPushState>) => {
    originalPushState(...args);
    dispatch();
  };
  window.history.replaceState = (...args: Parameters<typeof originalReplaceState>) => {
    originalReplaceState(...args);
    dispatch();
  };
  window.addEventListener("popstate", dispatch);
}

function useCurrentHash(): string {
  const [hash, setHash] = useState(() =>
    typeof window === "undefined" ? "" : window.location.hash,
  );
  useEffect(() => {
    ensureHistoryPatched();
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener("statementclinic:locationchange", update);
    window.addEventListener("hashchange", update);
    window.addEventListener("popstate", update);
    return () => {
      window.removeEventListener("statementclinic:locationchange", update);
      window.removeEventListener("hashchange", update);
      window.removeEventListener("popstate", update);
    };
  }, []);
  return hash;
}

/**
 * Subtle fade/slide-in on scroll. No animation library required — just
 * IntersectionObserver + a CSS transition. Fires once per element, respects
 * prefers-reduced-motion, and keeps content visible if JS hasn't hydrated
 * yet (so it never hides content on slow connections or for crawlers).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  hashId,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /**
   * If set, this Reveal shows its content immediately (no fade-in wait,
   * no dependence on IntersectionObserver timing) whenever the URL hash
   * targets it — e.g. hashId="about" for a nav link that jumps straight
   * to `#about`. Without this, a section reached via an instant hash-jump
   * can render blank until the next manual scroll, because the browser's
   * native jump can land before the observer's first callback fires.
   */
  hashId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [visible, setVisible] = useState(false);
  // Reactive to the actual browser URL hash (see useCurrentHash above for why
  // this can't rely on the router's own location state for same-route,
  // hash-only navigations).
  const currentHash = useCurrentHash(); // includes leading "#", e.g. "#about"

  useEffect(() => {
    if (hashId && currentHash === `#${hashId}`) {
      setVisible(true);

      // The browser's native "jump to #hash" scroll happens once, immediately
      // on navigation — often before web fonts have finished loading. This
      // page swaps in Fraunces/Karla via `font-display: swap`, and that swap
      // changes the metrics of every heading above this point, reflowing the
      // page and leaving the earlier scroll position stranded in the wrong
      // spot. Re-scrolling to the actual element once fonts are ready (and
      // once more after the next paint, in case anything else settles)
      // corrects for that reflow instead of guessing at a fixed offset.
      const scrollToNode = () => {
        // Target the actual element with this id (e.g. the <section id="about">)
        // rather than Reveal's own wrapper div, so any scroll-margin-top set on
        // that specific element is respected correctly.
        const target = document.getElementById(hashId) ?? ref.current;
        target?.scrollIntoView({ block: "start" });
      };

      const fontsReady =
        typeof document !== "undefined" && "fonts" in document
          ? document.fonts.ready
          : Promise.resolve();

      fontsReady.then(() => {
        scrollToNode();
        requestAnimationFrame(() => requestAnimationFrame(scrollToNode));
      });
    }
  }, [hashId, currentHash]);

  useEffect(() => {
    setIsClient(true);
    const node = ref.current;
    if (!node) return;

    if (hashId && currentHash === `#${hashId}`) {
      // Already handled by the effect above; no observer needed.
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // threshold: 0 fires as soon as any part of the target enters the
      // (margin-adjusted) viewport. A higher threshold requires that
      // fraction of the target's OWN total area to be visible at once,
      // which can be impossible to satisfy for a tall section (its area
      // can exceed what a single viewport can ever show), and is sensitive
      // to the sub-pixel rounding differences that browser zoom introduces
      // right at the boundary — which is what caused some sections to only
      // reveal at certain zoom levels.
      { threshold: 0, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safe default: fully visible unless client JS has confirmed it can animate
  // this in — so content is never hidden if JS fails to load or hasn't hydrated.
  const hidden = isClient && !visible;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: hidden ? "0ms" : `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        hidden ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
      } ${className}`}
    >
      {children}
    </div>
  );
}
