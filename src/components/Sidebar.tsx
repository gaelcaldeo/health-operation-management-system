
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ClipboardCheck,
  FileText,
  ClipboardList,
  Activity,
  ChartNoAxesCombined,
  Stethoscope,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Patients",
    href: "/patients",
    icon: Users,
  },
  {
    label: "Insurance",
    href: "/insurance",
    icon: ShieldCheck,
  },
  {
    label: "Eligibility",
    href: "/eligibility",
    icon: ClipboardCheck,
  },
  {
    label: "Claims",
    href: "/claims",
    icon: FileText,
  },
  {
    label: "Authorizations",
    href: "/authorizations",
    icon: ClipboardList,
  },
  {
    label: "Activity Logs",
    href: "/activity",
    icon: Activity,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: ChartNoAxesCombined,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  function isActiveRoute(href: string) {
    return href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Mobile Navigation Bar */}
      <header className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#167C80] text-white">
            <Stethoscope size={20} strokeWidth={1.8} />
          </div>

          <div>
            <h1 className="text-base font-bold tracking-[0.12em] text-[#142C43]">
              GAEL
            </h1>
            <p className="text-[9px] font-semibold tracking-[0.16em] text-slate-500">
              HOMS PLATFORM
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#142C43] transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#167C80]"
        >
          {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      {/* Mobile Backdrop */}
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 md:hidden"
        />
      )}

      {/* Mobile Navigation Drawer */}
      <aside
        id="mobile-navigation"
        aria-label="Mobile navigation"
        aria-hidden={!isMenuOpen}
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-[#142C43] text-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Brand */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <Link
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#167C80]">
              <Stethoscope size={21} strokeWidth={1.8} />
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-[0.12em]">
                GAEL
              </h2>
              <p className="text-[9px] font-semibold tracking-[0.18em] text-slate-400">
                HOMS PLATFORM
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close navigation menu"
            tabIndex={isMenuOpen ? 0 : -1}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Navigation */}
        <nav
          aria-label="Main navigation"
          className="flex-1 space-y-1 overflow-y-auto p-4"
        >
          <p className="px-3 pb-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Workspace
          </p>

          {navigation.map((item) => {
            const isActive = isActiveRoute(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                tabIndex={isMenuOpen ? 0 : -1}
                onClick={() => setIsMenuOpen(false)}
                className={`group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#167C80] text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={1.8}
                  className={
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white"
                  }
                />

                <span className="flex-1">{item.label}</span>

                {isActive && (
                  <ChevronRight size={15} className="text-white/80" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Drawer Footer */}
        <div className="border-t border-white/10 p-5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <p className="text-xs font-medium text-slate-300">
              System Online
            </p>
          </div>

          <p className="mt-3 text-[10px] tracking-wide text-slate-500">
            GAEL HOMS · Portfolio Edition
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            Version 1.0.0
          </p>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden w-[250px] shrink-0 flex-col border-r border-white/10 bg-[#142C43] text-white md:sticky md:top-0 md:flex md:h-screen">
        {/* Brand */}
        <div className="border-b border-white/10 px-6 py-6">
          <Link href="/" className="flex w-fit items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#167C80] shadow-sm">
              <Stethoscope size={23} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-[0.12em]">
                GAEL
              </h1>
              <p className="mt-0.5 text-[10px] font-semibold tracking-[0.18em] text-slate-400">
                HOMS PLATFORM
              </p>
            </div>
          </Link>

          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Healthcare Operations
          </p>
        </div>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-4"
        >
          <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Workspace
          </p>

          {navigation.map((item) => {
            const isActive = isActiveRoute(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#167C80] text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon
                  size={19}
                  strokeWidth={1.8}
                  className={
                    isActive
                      ? "text-white"
                      : "text-slate-400 transition-colors group-hover:text-white"
                  }
                />

                <span className="flex-1">{item.label}</span>

                {isActive && (
                  <ChevronRight size={15} className="text-white/80" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Footer */}
        <div className="border-t border-white/10 p-5">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <p className="text-xs font-medium text-slate-300">
              System Online
            </p>
          </div>

          <p className="mt-3 text-[10px] tracking-wide text-slate-500">
            GAEL HOMS · Portfolio Edition
          </p>

          <p className="mt-1 text-[10px] text-slate-500">
            Version 1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}
