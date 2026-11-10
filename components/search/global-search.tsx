"use client";

import { Dialog } from "@base-ui/react/dialog";
import { LoaderCircle, Search } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { API_ROUTES } from "@/lib/routes";

type SearchResult = {
  id: string;
  title: string;
  description: string;
  kind: string;
  href: string;
};

function isSearchPayload(value: unknown): value is { results: SearchResult[] } {
  if (typeof value !== "object" || value === null || !("results" in value)) {
    return false;
  }
  return (
    Array.isArray(value.results) &&
    value.results.every(
      (result: unknown) =>
        typeof result === "object" &&
        result !== null &&
        "id" in result &&
        "title" in result &&
        "description" in result &&
        "kind" in result &&
        "href" in result &&
        typeof result.id === "string" &&
        typeof result.title === "string" &&
        typeof result.description === "string" &&
        typeof result.kind === "string" &&
        typeof result.href === "string",
    )
  );
}

export function GlobalSearch({
  variant = "icon",
}: {
  variant?: "icon" | "bar";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [resultSet, setResultSet] = useState<{
    query: string;
    results: SearchResult[];
  } | null>(null);
  const [loadingQuery, setLoadingQuery] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<{
    query: string;
    message: string;
  } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim();
  const results = resultSet?.query === normalizedQuery ? resultSet.results : [];
  const error =
    searchError?.query === normalizedQuery ? searchError.message : null;
  const loading =
    open &&
    normalizedQuery.length >= 2 &&
    (loadingQuery === normalizedQuery ||
      (resultSet?.query !== normalizedQuery && error === null));

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    function onShortcut(event: WindowEventMap["keydown"]) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    const searchQuery = query.trim();
    if (!open || searchQuery.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoadingQuery(searchQuery);
      setSearchError(null);
      const params = new URLSearchParams({ q: searchQuery });
      try {
        const response = await fetch(`${API_ROUTES.search}?${params}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const payload: unknown = await response.json();
        if (!response.ok || !isSearchPayload(payload)) {
          throw new Error("Pencarian belum tersedia.");
        }
        setResultSet({ query: searchQuery, results: payload.results });
        setActiveIndex(0);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setSearchError({
            query: searchQuery,
            message:
              fetchError instanceof Error
                ? fetchError.message
                : "Pencarian belum tersedia.",
          });
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingQuery((current) =>
            current === searchQuery ? null : current,
          );
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && results.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter" && results[activeIndex]) {
      window.location.assign(results[activeIndex].href);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Cari di ruang kerja (Ctrl+K)"
        aria-keyshortcuts="Control+K Meta+K"
        className={
          variant === "bar"
            ? "flex min-h-10 min-w-0 flex-1 items-center gap-3 rounded-xl border border-[#e2e5dc] bg-white px-3 text-left text-sm text-peat-forest/55 shadow-sm transition hover:border-peat-green/35 hover:bg-[#fff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green sm:max-w-[28rem]"
            : "inline-grid size-10 shrink-0 place-items-center rounded-xl border border-peat-forest/10 bg-white text-peat-forest transition hover:bg-peat-forest/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peat-green"
        }
        type="button"
      >
        <Search aria-hidden="true" size={18} />
        {variant === "bar" ? (
          <>
            <span className="flex-1">Cari laporan, zona, atau data…</span>
            <span className="hidden items-center rounded-md border border-peat-forest/10 px-1.5 py-0.5 text-[10px] font-semibold text-peat-forest/45 md:flex">
              ⌘ / Ctrl K
            </span>
          </>
        ) : null}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[70] bg-[#172b22]/45 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-[12vh] left-1/2 z-[71] w-[min(44rem,calc(100%-1.5rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/70 bg-[#fbfcf8] shadow-[0_28px_100px_rgba(10,28,20,0.35)] outline-none sm:top-[15vh] sm:rounded-[1.65rem]">
          <Dialog.Title className="sr-only">Pencarian ruang kerja</Dialog.Title>
          <Dialog.Description className="sr-only">
            Cari data yang tersedia untuk peran akun ini.
          </Dialog.Description>
          <div className="flex items-center gap-3 border-b border-peat-forest/10 px-4 sm:px-6">
            <Search
              aria-hidden="true"
              className="shrink-0 text-peat-green"
              size={21}
            />
            <input
              autoComplete="off"
              autoFocus
              aria-controls="global-search-results"
              className="h-[4.5rem] min-w-0 flex-1 bg-transparent text-base text-peat-forest outline-none placeholder:text-peat-forest/40 sm:text-lg"
              onChange={(event) => {
                setQuery(event.currentTarget.value);
                setActiveIndex(0);
                setSearchError(null);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Cari laporan, zona, titik air…"
              ref={inputRef}
              type="search"
              value={query}
            />
            <Dialog.Close
              aria-label="Tutup pencarian"
              className="rounded-lg border border-peat-forest/10 px-2 py-1 text-xs font-semibold text-peat-forest/50 hover:bg-peat-forest/5 focus-visible:outline-2 focus-visible:outline-peat-green"
            >
              Esc
            </Dialog.Close>
          </div>
          <div
            className="max-h-[min(62vh,34rem)] overflow-y-auto p-2 sm:p-3"
            id="global-search-results"
          >
            {query.trim().length < 2 ? (
              <p className="px-4 py-8 text-center text-sm text-peat-forest/55">
                Ketik minimal 2 karakter untuk mulai mencari.
              </p>
            ) : loading ? (
              <p
                className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-peat-forest/60"
                role="status"
              >
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={17}
                />
                Mencari data…
              </p>
            ) : error ? (
              <p
                className="px-4 py-8 text-center text-sm text-critical"
                role="alert"
              >
                {error}
              </p>
            ) : results.length === 0 ? (
              <p
                className="px-4 py-8 text-center text-sm text-peat-forest/55"
                role="status"
              >
                Tidak ada hasil yang cocok dengan kata kunci ini.
              </p>
            ) : (
              <ul aria-label="Hasil pencarian" className="space-y-1">
                {results.map((result, index) => (
                  <li key={result.id}>
                    <Link
                      className={`block rounded-xl px-3 py-3 transition sm:px-4 ${index === activeIndex ? "bg-[#eaf1e8]" : "hover:bg-peat-forest/5"}`}
                      data-selected={index === activeIndex}
                      href={result.href}
                      onClick={close}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-bold text-peat-forest">
                          {result.title}
                        </span>
                        <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold tracking-wide text-peat-green uppercase">
                          {result.kind}
                        </span>
                      </span>
                      <span className="mt-1 block truncate text-xs text-peat-forest/60">
                        {result.description}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <p aria-live="polite" className="sr-only">
            {results[activeIndex]
              ? `Hasil terpilih ${activeIndex + 1} dari ${results.length}: ${results[activeIndex].title}`
              : ""}
          </p>
          <div className="flex items-center justify-between border-t border-peat-forest/10 px-4 py-3 text-[10px] font-medium text-peat-forest/45 sm:px-6">
            <span>Hasil mengikuti hak akses akun Anda</span>
            <span className="hidden sm:block">↑↓ navigasi · Enter buka</span>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
