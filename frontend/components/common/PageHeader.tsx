import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
  extra?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  className,
  extra,
}: PageHeaderProps) {
  return (
    <div className={cn("border-b border-space-navy-800 bg-space-navy-950/40 py-6 md:py-8 backdrop-blur-sm mb-6", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Breadcrumbs and Titles */}
          <div className="space-y-1">
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center space-x-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                <Link href="/" className="hover:text-cyan-accent transition-colors">
                  HOME
                </Link>
                {breadcrumbs.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                    {item.href ? (
                      <Link href={item.href} className="hover:text-cyan-accent transition-colors">
                        {item.label}
                      </Link>
                    ) : (
                      <span className="text-slate-400 font-semibold">{item.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}
            
            <div className="flex items-center space-x-3">
              <div className="h-6 w-1 bg-cyan-accent glow-dot-cyan rounded"></div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-white uppercase">
                {title}
              </h1>
            </div>
            
            {subtitle && (
              <p className="font-sans text-sm text-slate-400 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Extra telemetry readouts or action button slot */}
          {extra && (
            <div className="flex items-center space-x-3 self-start md:self-center font-mono">
              {extra}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
