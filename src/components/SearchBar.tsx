"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp } from "lucide-react";
import { categoryQueryValue } from "@/lib/categories";
import { useLanguage } from "@/lib/LanguageContext";

interface SearchResult {
  type: "product" | "category" | "brand";
  name: string;
  slug?: string;
}

const mockSuggestions: SearchResult[] = [
  { type: "category", name: "Men", slug: "men" },
  { type: "category", name: "Women", slug: "women" },
  { type: "category", name: "Traditional Wear", slug: "ethnic" },
  { type: "brand", name: "Himalayan Loom" },
  { type: "brand", name: "Kathmandu Threads" },
  { type: "product", name: "Silk Kurta", slug: "silk-kurta" },
  { type: "product", name: "Wool Sweater", slug: "wool-sweater" },
];

const trendingSearches = [
  "Silk Kurta",
  "Wool Sweater",
  "Pashmina",
  "Daura Suruwal",
  "Dhoti",
];

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered =
    query.length > 0
      ? mockSuggestions.filter((s) =>
          s.name.toLowerCase().includes(query.toLowerCase())
        )
      : mockSuggestions.slice(0, 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* ── Input row ── */}
      <form
        onSubmit={handleSubmit}
        className={`flex items-center rounded-full border border-border-default bg-card transition-all duration-200 ${
          open
            ? "border-fb-pink ring-2 ring-fb-pink/20"
            : "hover:border-border-light"
        } ${compact ? "h-9 text-xs" : "h-10 text-sm"}`}
      >
        <button
          type="submit"
          className="flex-shrink-0 pl-3 pr-1 text-text-muted transition-colors hover:text-fb-pink"
          aria-label={t("search_label")}
        >
          <Search className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
        </button>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={t("search")}
          className="flex-1 min-w-0 bg-transparent px-2 text-text-primary outline-none placeholder:text-text-muted"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="flex-shrink-0 pr-3 text-text-muted transition-colors hover:text-text-primary"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* ── Dropdown ── */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-xl border border-border-light bg-card shadow-[var(--shadow-md)]">
          {/* Trending */}
          {!query && (
            <div className="border-b border-border-light p-3">
              <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                <TrendingUp className="w-3 h-3" />
                {t("trending")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {trendingSearches.map((term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-text-secondary transition-colors hover:bg-fb-pink hover:text-white"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="max-h-64 overflow-y-auto">
            {filtered.map((item, idx) => (
              <Link
                key={idx}
                href={
                  item.type === "product" && item.slug
                    ? `/products/${item.slug}`
                    : item.type === "category"
                      ? `/products?category=${encodeURIComponent(categoryQueryValue(item.name))}`
                      : `/search?q=${encodeURIComponent(item.name)}`
                }
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--bg-hover)]"
              >
                <Search className="h-3.5 w-3.5 flex-shrink-0 text-text-muted" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {item.name}
                  </p>
                  <p className="text-[10px] capitalize text-text-muted">
                    {item.type}
                  </p>
                </div>
              </Link>
            ))}

            {query && filtered.length === 0 && (
              <div className="p-6 text-center">
                <p className="text-sm text-text-secondary">
                  {t("no_results_for", { query })}
                </p>
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setOpen(false)}
                  className="mt-1 inline-block text-xs font-bold text-fb-pink hover:underline"
                >
                  {t("view_all_results")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
