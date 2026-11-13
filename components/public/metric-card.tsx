"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { sectionReveal } from "@/components/public/public-section-motion";
import {
  MetricCount,
  type MetricCountProps,
} from "@/components/public/metric-count";

export function MetricCard({
  icon,
  label,
  value,
  unit,
  decimals,
  suffix,
  detail,
}: MetricCountProps & {
  icon: ReactNode;
  label: string;
  detail: string;
}) {
  return (
    <motion.article
      className="public-section__reveal public-metric-card"
      variants={sectionReveal}
    >
      <div className="public-metric-card__heading">
        <p>{label}</p>
        <span className="text-peat-green">{icon}</span>
      </div>
      <MetricCount
        value={value}
        unit={unit}
        decimals={decimals}
        suffix={suffix}
      />
      <p className="public-metric-card__detail">{detail}</p>
    </motion.article>
  );
}
