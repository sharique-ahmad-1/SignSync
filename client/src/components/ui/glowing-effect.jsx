"use client";
import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

export const GlowingEffect = ({
  children,
  active = false,
  className,
  glowColor = "rgba(16, 185, 129, 0.7)", // Emerald glow default
  secondaryColor = "rgba(6, 182, 212, 0.5)", // Cyan aura
  borderGlow = true
}) => {
  return (
    <div className={cn("relative rounded-2xl overflow-hidden group", className)}>
      <AnimatePresence>
        {active && (
          <>
            {/* Dynamic Ambient Blur Glow Layer */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute -inset-[3px] rounded-2xl pointer-events-none z-0 filter blur-xl will-change-transform"
              style={{
                background: `linear-gradient(135deg, ${glowColor}, ${secondaryColor}, ${glowColor})`,
                opacity: 0.85
              }}
            />

            {/* Glowing Border Sweep */}
            {borderGlow && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 rounded-2xl pointer-events-none z-20 border-2"
                style={{
                  borderColor: glowColor,
                  boxShadow: `0 0 20px 2px ${glowColor}, inset 0 0 15px 1px ${secondaryColor}`
                }}
              />
            )}

            {/* Subtle Radiant Sweep Line */}
            <motion.div
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: "linear",
              }}
              className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-20 skew-x-12"
            />
          </>
        )}
      </AnimatePresence>

      {/* Child Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
