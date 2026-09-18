"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CornerDownLeft, Search, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ALL_NAV_ITEMS, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * ⌘K / Ctrl+K quick navigator. Rendered inside the dashboard shell; opens on the
 * shortcut, on a header trigger, or programmatically. Lists every dashboard route
 * and supports full keyboard navigation (type, arrows, Enter, Esc).
 */
export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global ⌘K / Ctrl+K shortcut toggles the palette.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  // Focus the input whenever the palette opens, and reset the query.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Wait for the dialog content to mount before focusing.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_NAV_ITEMS;
    return ALL_NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(q) || item.path.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const goTo = (item: NavItem) => {
    onOpenChange(false);
    router.push(item.path);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (results.length === 0 ? 0 : (i - 1 + results.length) % results.length));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      goTo(results[activeIndex]);
    }
  };

  // Keep the highlighted row in view while navigating with the keyboard.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-palette-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, results]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          onOpenAutoFocus={(e) => e.preventDefault()}
          aria-describedby={undefined}
          className="fixed top-[15vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl border border-white/10 bg-popover text-popover-foreground shadow-2xl shadow-black/40 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
        >
          <DialogPrimitive.Title className="sr-only">Quick navigation</DialogPrimitive.Title>

          {/* Search input */}
          <div className="flex items-center gap-2.5 border-b border-white/10 px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Where do you want to go?"
              aria-label="Search pages"
              role="combobox"
              aria-expanded="true"
              aria-controls="palette-results"
              aria-activedescendant={results[activeIndex] ? `palette-item-${results[activeIndex].path}` : undefined}
              className="h-12 w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden shrink-0 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            id="palette-results"
            role="listbox"
            className="max-h-[min(50vh,22rem)] overflow-y-auto p-1.5"
          >
            {results.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No pages match “{query}”.
              </p>
            ) : (
              results.map((item, index) => {
                const Icon = item.icon;
                const active = index === activeIndex;
                return (
                  <button
                    key={item.path}
                    id={`palette-item-${item.path}`}
                    data-palette-index={index}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goTo(item)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                      active ? "bg-secondary text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </span>
                    {active && (
                      <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <DialogPrimitive.Close asChild>
            <button
              aria-label="Close quick search"
              className="absolute top-3 right-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
