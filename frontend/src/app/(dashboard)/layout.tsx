"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Home,
  LayoutGrid,
  LogOut,
  Search,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { Dialog as DialogPrimitive, DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { CommandPalette } from "@/components/command-palette";
import { PceaLogoMark } from "@/components/pcea-logo";
import { EXPLORE_SECTIONS, PRIMARY_NAV, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const apiHost = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, "");

function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.path) return true;
  if (item.path === "/dashboard" && pathname === "/") return true;
  if (item.matchPrefix && item.path !== "/dashboard" && pathname.startsWith(item.path + "/")) return true;
  return false;
}

function MenuItemLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const active = isActive(pathname, item);
  return (
    <Link
      href={item.path}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {item.label}
    </Link>
  );
}

function MenuGroupList({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-0.5">
      {items.map((item) => (
        <MenuItemLink key={item.path} item={item} pathname={pathname} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    // Fetch unread notification count
    fetch(`${apiHost}/api/notifications/me/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.count != null) setUnreadCount(data.data.count);
      })
      .catch(() => {});
  }, [pathname, router]);

  // Keep the mobile menu in sync with navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${apiHost}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setMenuOpen(false);
    router.push("/login");
  };

  if (!mounted) return null;

  const userName =
    typeof window !== "undefined"
      ? (() => {
          try {
            const raw = localStorage.getItem("user");
            if (!raw) return "";
            const parsed = JSON.parse(raw);
            return parsed?.name || "";
          } catch {
            return "";
          }
        })()
      : "";

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d1424]/90 backdrop-blur-md">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              aria-label="PCEA Connect home"
            >
              <PceaLogoMark width={24} height={34} />
              <span className="text-lg font-bold tracking-tight text-white">
                PCEA <span className="text-accent">Connect</span>
              </span>
            </Link>

            {/* Desktop primary nav */}
            <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
              {PRIMARY_NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item);
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                      active
                        ? "bg-secondary text-white"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-1.5">
              {/* Quick search (⌘K) */}
              <button
                onClick={() => setPaletteOpen(true)}
                aria-label="Quick search (Ctrl K)"
                className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <Search className="size-4" aria-hidden="true" />
                <span className="hidden md:inline">Search</span>
                <kbd className="ml-1 hidden rounded border border-white/10 bg-black/20 px-1 py-px text-[10px] font-medium text-muted-foreground lg:inline">
                  ⌘K
                </kbd>
              </button>

              {/* Notifications */}
              <Link
                href="/notifications"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <Bell className="size-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Desktop account menu */}
              <DropdownMenuPrimitive.Root>
                <DropdownMenuPrimitive.Trigger asChild>
                  <button
                    aria-label="Account menu"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-transform hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                  >
                    {userName ? userName.charAt(0).toUpperCase() : "U"}
                  </button>
                </DropdownMenuPrimitive.Trigger>
                <DropdownMenuPrimitive.Portal>
                  <DropdownMenuPrimitive.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 min-w-52 rounded-xl border border-white/10 bg-popover p-1.5 text-sm text-popover-foreground shadow-xl shadow-black/40"
                  >
                    {userName && (
                      <div className="border-b border-white/10 px-3 py-2 text-xs text-muted-foreground">
                        Signed in as <span className="font-medium text-foreground">{userName}</span>
                      </div>
                    )}
                    <DropdownMenuItem href="/settings" icon={Settings} label="Account settings" />
                    <DropdownMenuItem href="/notifications" icon={Bell} label="Notifications" />
                    <DropdownMenuPrimitive.Separator className="my-1 h-px bg-white/10" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      Sign out
                    </button>
                  </DropdownMenuPrimitive.Content>
                </DropdownMenuPrimitive.Portal>
              </DropdownMenuPrimitive.Root>

              {/* Desktop “More” menu */}
              <DropdownMenuPrimitive.Root>
                <DropdownMenuPrimitive.Trigger asChild>
                  <button
                    aria-label="Browse all sections"
                    className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 lg:flex"
                  >
                    <LayoutGrid className="size-4" aria-hidden="true" />
                    More
                  </button>
                </DropdownMenuPrimitive.Trigger>
                <DropdownMenuPrimitive.Portal>
                  <DropdownMenuPrimitive.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 max-h-[min(70vh,36rem)] w-72 overflow-y-auto rounded-xl border border-white/10 bg-popover p-2 text-sm text-popover-foreground shadow-xl shadow-black/40"
                  >
                    {EXPLORE_SECTIONS.map((section) => (
                      <div key={section.title} className="mb-1.5 last:mb-0">
                        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {section.title}
                        </p>
                        <MenuGroupList items={section.items} pathname={pathname} />
                      </div>
                    ))}
                  </DropdownMenuPrimitive.Content>
                </DropdownMenuPrimitive.Portal>
              </DropdownMenuPrimitive.Root>

            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 md:pb-10">
        {children}
      </main>

      {/* ── Mobile menu (dialog) ───────────────────────────────── */}
      <DialogPrimitive.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-closed:animate-out data-closed:fade-out-0" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-[#0d1424] p-5 pb-8 text-foreground shadow-2xl outline-none data-open:animate-in data-open:slide-in-from-bottom-8 data-closed:animate-out data-closed:slide-out-to-bottom-8"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>
              <DialogPrimitive.Close asChild>
                <button
                  aria-label="Close menu"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </DialogPrimitive.Close>
            </div>

            <nav aria-label="Mobile navigation" className="space-y-5">
              <MenuGroupList
                items={[{ label: "Home", path: "/dashboard", icon: Home }]}
                pathname={pathname}
                onNavigate={() => setMenuOpen(false)}
              />
              {EXPLORE_SECTIONS.map((section) => (
                <div key={section.title}>
                  <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </p>
                  <MenuGroupList items={section.items} pathname={pathname} onNavigate={() => setMenuOpen(false)} />
                </div>
              ))}
            </nav>

            <div className="mt-6 flex flex-col gap-1.5 border-t border-white/10 pt-4">
              <MenuItemLink
                item={{ label: "Account settings", path: "/settings", icon: Settings }}
                pathname={pathname}
                onNavigate={() => setMenuOpen(false)}
              />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                <LogOut className="size-4 shrink-0" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* ── Mobile bottom navigation ───────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0d1424]/95 backdrop-blur-md md:hidden"
        aria-label="Bottom navigation"
      >
        <div className="flex h-16 items-stretch">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={active ? "page" : undefined}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors focus-visible:outline-none"
              >
                <Icon
                  className={cn("size-5", active ? "text-accent" : "text-gray-500")}
                  aria-hidden="true"
                />
                <span className={active ? "text-accent" : "text-gray-500"}>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium focus-visible:outline-none"
          >
            <LayoutGrid className={cn("size-5", menuOpen ? "text-accent" : "text-gray-500")} aria-hidden="true" />
            <span className={menuOpen ? "text-accent" : "text-gray-500"}>More</span>
          </button>
        </div>
      </nav>

      {/* Content bottom padding for the mobile nav bar */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* ⌘K quick navigation palette */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

/** Small wrapper for consistent avatar-menu rows. */
function DropdownMenuItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <DropdownMenuPrimitive.Item asChild>
      <Link
        href={href}
        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <Icon className="size-4" aria-hidden="true" />
        {label}
      </Link>
    </DropdownMenuPrimitive.Item>
  );
}
