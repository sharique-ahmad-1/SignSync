"use client";
import React from "react";
import { cn } from "../../lib/utils";

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col min-h-screen w-full bg-slate-50 text-slate-800 transition-colors overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className={cn(
            `
            [--white-gradient:repeating-linear-gradient(100deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.7)_7%,transparent_10%,transparent_12%,rgba(255,255,255,0.7)_16%)]
            [--light-gradient:repeating-linear-gradient(100deg,#f8fafc_0%,#f8fafc_7%,transparent_10%,transparent_12%,#f8fafc_16%)]
            [--aurora:repeating-linear-gradient(100deg,#6366f1_10%,#38bdf8_15%,#34d399_20%,#f472b6_25%,#818cf8_30%)]
            [background-image:var(--light-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[32px]
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--light-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed]
            pointer-events-none
            absolute -inset-[10px] opacity-20 will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_50%_0%,black_50%,transparent_90%)]`
          )}
        />
      </div>
      <div className="relative z-10 w-full flex-1 flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
};
