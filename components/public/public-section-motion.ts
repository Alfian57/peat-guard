import type { Variants } from "motion/react";

// Keep content readable before hydration; only decorative layers use parallax.
export const sectionReveal: Variants = {
  rest: { opacity: 1, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.15, ease: [0.32, 0, 0.2, 1] },
  },
};
