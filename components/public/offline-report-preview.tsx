"use client";

import Image from "next/image";
import { motion, useTransform, type MotionValue } from "motion/react";

import "./offline-report-preview.css";

const captureScreen = "/images/field-app-capture.webp";
const savedScreen = "/images/field-app-saved.webp";
const sentScreen = "/images/field-app-sent.webp";

export function OfflineReportPreview({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, [0.15, 0.27], [0, 1]);
  const y = useTransform(progress, [0.15, 0.27], [28, 0]);
  const captureOpacity = useTransform(progress, [0.35, 0.41], [1, 0]);
  const savedOpacity = useTransform(
    progress,
    [0.35, 0.41, 0.7, 0.76],
    [0, 1, 1, 0],
  );
  const sentOpacity = useTransform(progress, [0.73, 0.81], [0, 1]);

  return (
    <motion.figure
      className="offline-phone"
      style={{ opacity, y }}
      aria-label="Tangkapan layar aplikasi relawan: membuat laporan, menyimpan draf offline, lalu menyinkronkannya ke posko."
    >
      <div className="offline-phone__device" aria-hidden="true">
        <span className="offline-phone__key offline-phone__key--mute" />
        <span className="offline-phone__key offline-phone__key--volume" />
        <span className="offline-phone__key offline-phone__key--power" />
        <div className="offline-phone__frame">
          <div className="offline-phone__speaker" />
          <div className="offline-phone__lens" />
          <div className="offline-phone__screen">
            <motion.div
              className="offline-phone__state offline-phone__state--capture"
              style={{ opacity: captureOpacity }}
            >
              <Image
                src={captureScreen}
                alt=""
                unoptimized
                loading="eager"
                fetchPriority="low"
                fill
                sizes="(max-width: 767px) 132px, 300px"
              />
            </motion.div>
            <motion.div
              className="offline-phone__state offline-phone__state--saved"
              style={{ opacity: savedOpacity }}
            >
              <Image
                src={savedScreen}
                alt=""
                unoptimized
                loading="eager"
                fetchPriority="low"
                fill
                sizes="(max-width: 767px) 132px, 300px"
              />
            </motion.div>
            <motion.div
              className="offline-phone__state offline-phone__state--sent"
              style={{ opacity: sentOpacity }}
            >
              <Image
                src={sentScreen}
                alt=""
                unoptimized
                loading="eager"
                fetchPriority="low"
                fill
                sizes="(max-width: 767px) 132px, 300px"
              />
            </motion.div>
          </div>
          <div className="offline-phone__home-indicator" />
        </div>
      </div>
    </motion.figure>
  );
}
