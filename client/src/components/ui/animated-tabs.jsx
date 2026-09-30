"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const AnimatedTabs = ({
  tabs,
  activeTab,
  onChange,
  containerClassName,
  tabClassName,
  activeTabClassName,
}) => {
  return (
    <div
      className={cn(
        "flex flex-row items-center justify-start relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-fit bg-slate-100 p-1 rounded-2xl border border-slate-200",
        containerClassName
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "relative px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 z-10 cursor-pointer",
              tabClassName,
              isActive && cn("text-white font-bold", activeTabClassName)
            )}
            style={{
              transformStyle: "preserve-3d",
            }}
          >
            {isActive && (
              <motion.span
                layoutId="activeTabPill"
                transition={{ type: "spring", bounce: 0.22, duration: 0.6 }}
                className="absolute inset-0 bg-indigo-600 rounded-xl shadow-sm -z-10"
              />
            )}
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="relative block">{tab.title}</span>
          </button>
        );
      })}
    </div>
  );
};
