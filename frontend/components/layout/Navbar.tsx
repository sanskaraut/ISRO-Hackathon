"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Satellite, Compass, Cpu, Menu, X, Globe } from "lucide-react";

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Globe },
  { href: "/demo", label: "Demo", icon: Cpu },
  { href: "/explorer", label: "Cyclone Explorer", icon: Compass },
  { href: "/about", label: "About Model", icon: Satellite },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-space-navy-800 bg-space-navy-950/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-electric-blue/30 bg-space-navy-900 text-electric-blue transition-all duration-300 group-hover:border-cyan-accent group-hover:text-cyan-accent">
              <Satellite className="h-5 w-5 animate-pulse-slow" />
              <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-cyan-accent glow-dot-cyan"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-bold tracking-wider text-white transition-colors duration-300 group-hover:text-cyan-accent">
                CYC-INTEL
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">
                Satellite OPS Center
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 rounded-md font-sans text-sm font-medium tracking-wide transition-colors duration-300"
                >
                  <span className="flex items-center space-x-1.5 text-slate-300 hover:text-white transition-colors duration-300 z-10 relative">
                    <Icon className={`h-4 w-4 ${isActive ? "text-cyan-accent" : "text-slate-400"}`} />
                    <span>{link.label}</span>
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="activeNavBackground"
                      className="absolute inset-0 rounded-md border border-cyan-accent/20 bg-space-navy-900/60 z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Button & GitHub link */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-9 w-9 rounded-lg border border-space-navy-800 bg-space-navy-900 text-slate-400 hover:text-white hover:border-slate-500 transition-all duration-300"
              title="GitHub Repository"
            >
              <Github className="h-5 w-5" />
            </a>
            
            <Link
              href="/demo"
              className="relative inline-flex items-center justify-center px-4 py-1.5 text-xs font-mono font-semibold tracking-wider text-cyan-accent uppercase border border-cyan-accent/30 bg-cyan-accent/5 hover:bg-cyan-accent/15 transition-all duration-300 rounded tech-corners"
            >
              System Online
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-space-navy-900 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-space-navy-800 bg-space-navy-950/95 backdrop-blur-lg overflow-hidden"
          >
            <div className="space-y-1 px-4 py-3 sm:px-6">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? "bg-space-navy-900 border-l-2 border-cyan-accent text-cyan-accent"
                        : "text-slate-300 hover:bg-space-navy-900/50 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
              <div className="border-t border-space-navy-800 pt-4 mt-4 flex items-center justify-between px-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-slate-400 hover:text-white"
                >
                  <Github className="h-5 w-5" />
                  <span className="text-sm">GitHub Repository</span>
                </a>
                <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-cyan-accent/10 text-cyan-accent border border-cyan-accent/20">
                  OPS: ACTIVE
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
