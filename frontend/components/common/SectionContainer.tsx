import React from "react";
import { cn } from "@/lib/utils";

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  fluid?: boolean;
}

export default function SectionContainer({
  children,
  className,
  id,
  fluid = false,
}: SectionContainerProps) {
  return (
    <section
      id={id}
      className={cn(
        "py-12 md:py-20 relative w-full",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto px-4 sm:px-6 lg:px-8",
          fluid ? "max-w-none w-full" : "max-w-7xl"
        )}
      >
        {children}
      </div>
    </section>
  );
}
