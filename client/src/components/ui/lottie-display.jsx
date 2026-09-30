"use client";
import React from "react";
import { Lottie } from "lottie-react";
import { cn } from "../../lib/utils";

export const LottieDisplay = ({
  animationData,
  className,
  loop = true,
  autoplay = true,
  style
}) => {
  if (!animationData) return null;

  return (
    <div className={cn("inline-flex items-center justify-center pointer-events-none", className)}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{ width: "100%", height: "100%", ...style }}
      />
    </div>
  );
};
