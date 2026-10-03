"use client";

import { ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";
import Logo from "@/components/Logo";

const navItems = [
  { label: "今日課程", href: "/" },
  { label: "本週課表", href: "/week" },
  { label: "固定課程", href: "/enrollments" },
  { label: "學生", href: "/students" },
  { label: "老師", href: "/teachers" },
  { label: "月結", href: "/settlement" },
  { label: "健檢", href: "/health" },
];

export default function Navbar({
  showTeacherLink = false,
}: {
  showTeacherLink?: boolean;
}) {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email ?? null);
    }

    loadUser();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-surface/90 text-foreground backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex shrink-0 items-baseline gap-3"
          >
            <Logo size="sm" />

            <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              Admin
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? "whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary"
                      : "whitespace-nowrap rounded-full px-4 py-2 text-sm text-muted transition hover:bg-fill hover:text-foreground"
                  }
                >
                  {item.label}
                </Link>
              );
            })}

            {showTeacherLink && (
              <Link
                href="/teacher"
                className="ml-2 whitespace-nowrap rounded-xl border border-line-strong px-4 py-2 text-sm text-foreground hover:bg-fill hover:text-foreground"
              >
                老師模式
              </Link>
            )}

            {email && (
              <span className="ml-2 max-w-40 truncate text-xs text-muted">
                {email}
              </span>
            )}

            <LogoutButton />
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-foreground hover:bg-fill lg:hidden"
            aria-label={menuOpen ? "關閉選單" : "開啟選單"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X aria-hidden className="h-5 w-5" />
            ) : (
              <Menu aria-hidden className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-line pb-4 pt-3 lg:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      isActive
                        ? "rounded-xl bg-primary px-4 py-3 text-sm font-medium text-on-primary"
                        : "rounded-xl px-4 py-3 text-sm text-muted hover:bg-fill hover:text-foreground"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="mt-3 border-t border-line pt-3">
                {showTeacherLink && (
                  <Link
                    href="/teacher"
                    className="inline-flex items-center gap-1 mb-2 block rounded-xl px-4 py-3 text-sm text-foreground hover:bg-fill hover:text-foreground"
                  >
                    老師模式
                    <ChevronRight aria-hidden className="h-4 w-4 shrink-0" />
                  </Link>
                )}

                {email && (
                  <p className="mb-2 truncate px-4 text-xs text-muted">
                    {email}
                  </p>
                )}

                <LogoutButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}