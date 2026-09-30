"use client";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * React Bits - Magnetic Interaction Button
 * Attracts gently towards cursor on hover with spring physics
 */
export const MagneticButton = ({
  children,
  className,
  onClick,
  disabled = false,
  pullStrength = 0.35,
  ...props
}) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (disabled || !ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * pullStrength, y: middleY * pullStrength });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 220, damping: 14, mass: 0.1 }}
      whileTap={{ scale: 0.94 }}
      className={cn(
        "relative inline-flex items-center justify-center cursor-pointer select-none transition-colors",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
};

/**
 * React Bits - Shiny Interactive Button
 * Subtle shimmering light sweep micro-animation
 */
export const ShinyButton = ({
  children,
  className,
  onClick,
  disabled = false,
  ...props
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 18 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative overflow-hidden rounded-xl px-4 py-2 font-semibold text-xs transition-all shadow-md group",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
      {...props}
    >
      {/* Light glimmer sweep */}
      <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-in-out pointer-events-none" />
      <span className="relative z-10 flex items-center justify-center gap-1.5">
        {children}
      </span>
    </motion.button>
  );
};
