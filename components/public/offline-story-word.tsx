"use client";

import { motion, useTransform, type MotionValue } from "motion/react";

export function OfflineStoryWord({
  word,
  index,
  total,
  progress,
}: {
  word: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(progress, [start, end], [0, 1]);
  const filter = useTransform(opacity, (value) => `blur(${(1 - value) * 7}px)`);
  const y = useTransform(opacity, [0, 1], [4, 0]);

  return (
    <>
      <motion.span
        className="offline-story__word"
        style={{ opacity, filter, y }}
      >
        {word}
      </motion.span>{" "}
    </>
  );
}
