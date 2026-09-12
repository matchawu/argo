"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
  { label: "今日課程", href: "/" },
  { label: "本週課表", href: "/week" },
  { label: "固定課程", href: "/enrollments" },
  { label: "學生", href: "/students" },
  { label: "老師", href: "/teachers" },
  { label: "月結", href: "/settlement" },
  { label: "健檢", href: "/health" },
];

export default function Navbar() {
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
    <nav className="border-b border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-4">
          <Link
            href="/"
            className="shrink-0 text-xl font-bold tracking-tight"
          >
            Argo
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-2 md:flex">
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
                      ? "rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
                      : "rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }
                >
                  {item.label}
                </Link>
              );
            })}

            {email && (
              <span className="ml-2 max-w-40 truncate text-xs text-zinc-500">
                {email}
              </span>
            )}

            <LogoutButton />
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-900 md:hidden"
            aria-label={menuOpen ? "關閉選單" : "開啟選單"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <span className="text-xl">✕</span>
            ) : (
              <span className="text-xl">☰</span>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-zinc-800 pb-4 pt-3 md:hidden">
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
                        ? "rounded-xl bg-white px-4 py-3 text-sm font-medium text-black"
                        : "rounded-xl px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="mt-3 border-t border-zinc-800 pt-3">
                {email && (
                  <p className="mb-2 truncate px-4 text-xs text-zinc-500">
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