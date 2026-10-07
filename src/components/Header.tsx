"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Bookmark, ClipboardList, Globe2 } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";

export function Header() {
  const path = usePathname();
  const nav = [
    { href: "/saved", label: "Saved", icon: Bookmark },
    { href: "/applications", label: "Applications", icon: ClipboardList },
  ];
  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--accent)] text-white"><Globe2 size={18} /></span>
          <span className="hidden sm:inline">Remote Jobs</span>
        </Link>
        <div className="min-w-0 flex-1">
          <Suspense fallback={<div className="skeleton h-10 w-full" />}><SearchBar /></Suspense>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="btn btn-ghost border-transparent" data-active={path === n.href} style={path === n.href ? { background: "var(--accent-soft)", color: "var(--accent-ink)" } : undefined}>
              <n.icon size={16} /> {n.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
