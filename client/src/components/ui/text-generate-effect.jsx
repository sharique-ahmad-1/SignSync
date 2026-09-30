"use client";
import React, { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "../../lib/utils";

export const TextGenerateEffect = ({
  words,
  className,
  filter = true,
  duration = 0.35,
}) => {
  const [scope, animate] = useAnimate();
  const wordsArray = words ? words.split(" ") : [];

  useEffect(() => {
    if (wordsArray.length > 0 && scope.current) {
      animate(
        "span",
        {
          opacity: 1,
          filter: filter ? "blur(0px)" : "none",
          y: 0
        },
        {
          duration: duration || 0.3,
          delay: stagger(0.04),
        }
      );
    }
  }, [words, animate, filter, duration, scope, wordsArray.length]);

  if (!words) return null;

  return (
    <div className={cn("font-medium", className)}>
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          return (
            <motion.span
              key={word + idx}
              initial={{
                opacity: 0,
                filter: filter ? "blur(8px)" : "none",
                y: 4
              }}
              className="text-slate-100 inline-block mr-1.5 will-change-transform"
            >
              {word}
            </motion.span>
          );
        })}
      </motion.div>
    </div>
  );
};
