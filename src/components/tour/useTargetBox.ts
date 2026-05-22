"use client";

import { useEffect, useState } from "react";

export type TargetBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const SCROLL_DELAY = 220;

export function useTargetBox(anchor: string | null): {
  box: TargetBox | null;
  element: HTMLElement | null;
  missing: boolean;
} {
  const [box, setBox] = useState<TargetBox | null>(null);
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!anchor) {
      setBox(null);
      setElement(null);
      setMissing(false);
      return;
    }

    let cancelled = false;
    let observer: ResizeObserver | null = null;
    let target: HTMLElement | null = null;
    let scrollTimer: number | null = null;
    const scrollListeners: Array<{
      el: EventTarget;
      handler: EventListener;
    }> = [];

    const measure = () => {
      if (cancelled || !target) return;
      const rect = target.getBoundingClientRect();
      setBox({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    const attempt = (tries: number) => {
      if (cancelled) return;
      const found = document.querySelector<HTMLElement>(
        `[data-tour="${anchor}"]`,
      );
      if (!found) {
        if (tries > 0) {
          window.setTimeout(() => attempt(tries - 1), 120);
        } else {
          setMissing(true);
        }
        return;
      }
      target = found;
      setElement(found);
      setMissing(false);

      found.scrollIntoView({ block: "center", behavior: "smooth" });
      scrollTimer = window.setTimeout(() => {
        measure();
      }, SCROLL_DELAY);

      observer = new ResizeObserver(() => measure());
      observer.observe(found);
      observer.observe(document.body);

      const onScrollOrResize = () => measure();
      window.addEventListener("scroll", onScrollOrResize, true);
      window.addEventListener("resize", onScrollOrResize);
      scrollListeners.push({ el: window, handler: onScrollOrResize });
    };

    attempt(8);

    return () => {
      cancelled = true;
      if (scrollTimer !== null) window.clearTimeout(scrollTimer);
      observer?.disconnect();
      scrollListeners.forEach(({ handler }) => {
        window.removeEventListener("scroll", handler, true);
        window.removeEventListener("resize", handler);
      });
    };
  }, [anchor]);

  return { box, element, missing };
}
