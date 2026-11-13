"use client";

import {
  motion,
  useScroll,
  useTransform,
  type MotionStyle,
  type MotionValue,
} from "motion/react";
import { useRef, type ReactNode } from "react";

import "./public-sections.css";

export function PublicSection({
  id,
  labelledBy,
  className = "",
  children,
}: {
  id: string;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
    trackContentSize: true,
  });
  const lineProgress = useTransform(scrollYProgress, [0.12, 0.52], [0, 1]);
  const sectionStyle: MotionStyle & {
    "--section-progress": MotionValue<number>;
  } = {
    "--section-progress": lineProgress,
  };

  return (
    <motion.section
      aria-labelledby={labelledBy}
      className={`public-section ${className}`}
      id={id}
      ref={sectionRef}
      initial="rest"
      whileInView="visible"
      viewport={{ once: true, amount: 0.16 }}
      variants={{
        rest: {},
        visible: { transition: { staggerChildren: 0.12 } },
      }}
      style={sectionStyle}
    >
      {children}
    </motion.section>
  );
}
