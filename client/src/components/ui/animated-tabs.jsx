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
        "flex flex-row items-center justify-start relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-fit bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner",
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
              "relative px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 z-10",
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
                className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 rounded-xl shadow-md shadow-indigo-600/30 -z-10"
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
