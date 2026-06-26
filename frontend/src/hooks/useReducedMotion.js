/**
 * useReducedMotion — returns true when the user has requested
 * reduced motion via their OS accessibility settings.
 *
 * Use this to skip or simplify Framer Motion animations that
 * are JS-driven (and therefore bypass the CSS media query).
 *
 * Usage:
 *   const shouldReduce = useReducedMotion();
 *   const variants = shouldReduce ? staticVariants : animatedVariants;
 */

import { useState, useEffect } from "react";

export function useReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
}
