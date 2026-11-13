"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useMemo, useRef } from "react";

export type MetricCountProps = {
  value: number;
  unit: string;
  decimals?: number;
  suffix?: string;
};

export function MetricCount({
  value,
  unit,
  decimals = 0,
  suffix = "",
}: MetricCountProps) {
  const valueRef = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(valueRef, { once: true, amount: 0.6 });
  const reducedMotion = useReducedMotion();
  const count = useMotionValue(0);
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("id-ID", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [decimals],
  );
  const display = useTransform(count, (current) => formatter.format(current));
  const finalValue = `${formatter.format(value)}${suffix} ${unit}`;

  useEffect(() => {
    if (!isInView || reducedMotion) return;
    const animation = animate(count, value, {
      duration: 2.2,
      ease: [0.32, 0, 0.2, 1],
    });
    return () => animation.stop();
  }, [count, isInView, reducedMotion, value]);

  return (
    <p className="public-metric-card__value" ref={valueRef}>
      <span className="sr-only">{finalValue}</span>
      <span className="public-metric-count__animated" aria-hidden="true">
        <motion.span>{display}</motion.span>
        {suffix} {unit}
      </span>
      <span className="public-metric-count__static" aria-hidden="true">
        {finalValue}
      </span>
    </p>
  );
}
