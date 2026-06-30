"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedDividerProps {
  className?: string;
  glow?: boolean;
}

export default function AnimatedDivider({
  className,
  glow = false,
}: AnimatedDividerProps) {
  return (
    <div className={cn("relative w-full h-[1px] bg-space-navy-800 my-8 overflow-hidden", className)}>
      <motion.div
        className={cn(
          "absolute top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-accent to-transparent",
          glow ? "w-40 bg-gradient-to-r from-transparent via-cyan-accent to-transparent opacity-100" : "w-24 opacity-60"
        )}
        initial={{ left: "-20%" }}
        animate={{ left: "120%" }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "linear",
        }}
      />
    </div>
  );
}
