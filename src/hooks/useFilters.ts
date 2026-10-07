"use client";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEFAULT_FILTERS, filtersFromSearchParams, filtersToSearchParams, type Filters } from "@/lib/filters";

/** Filters live in the URL so searches are shareable and the back button works. */
export function useFilters() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const filters = useMemo(() => filtersFromSearchParams(new URLSearchParams(sp.toString())), [sp]);

  const set = useCallback((patch: Partial<Filters>, opts: { replace?: boolean } = {}) => {
    const next: Filters = { ...filters, ...patch, page: patch.page ?? 1 };
    const qs = filtersToSearchParams(next).toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    opts.replace ? router.replace(url, { scroll: false }) : router.push(url, { scroll: false });
  }, [filters, pathname, router]);

  const toggle = useCallback(<K extends "regions" | "categories" | "experience" | "employment" | "skills" | "education" | "languages" | "companyType" | "sources" | "verification">(key: K, value: string) => {
    const cur = filters[key] as string[];
    set({ [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] } as Partial<Filters>);
  }, [filters, set]);

  const clear = useCallback(() => router.push(pathname, { scroll: false }), [pathname, router]);
  return { filters, set, toggle, clear, isDefault: filtersToSearchParams(filters).toString() === filtersToSearchParams(DEFAULT_FILTERS).toString() };
}
