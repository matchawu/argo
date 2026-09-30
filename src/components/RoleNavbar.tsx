"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "@/components/LogoutButton";

type NavItem = {
  label: string;
  href: string;
};

type Props = {
  brand: string;
  homeHref: string;
  items: NavItem[];
  /*
   * 切換到另一個身份的入口（例如老闆從老師模式回到管理後台）
   */
  switchLink?: NavItem;
};

/*
 * 老師 / 學生共用 navbar
 *
 * 桌面：單列按鈕
 * 手機：漢堡選單
 */
export default function RoleNavbar({
  brand,
  homeHref,
  items,
  switchLink,
}: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    return href === homeHref
      ? pathname === homeHref
      : pathname.startsWith(href);
  }

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-4">
          <Link
            href={homeHref}
            onClick={() => setMenuOpen(false)}
            className="shrink-0 text-xl font-bold tracking-tight"
          >
            {brand}
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-2 md:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive(item.href)
                    ? "whitespace-nowrap rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
                    : "whitespace-nowrap rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }
              >
                {item.label}
              </Link>
            ))}

            {switchLink && (
              <Link
                href={switchLink.href}
                className="whitespace-nowrap rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
              >
                {switchLink.label}
              </Link>
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
            <span className="text-xl">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-zinc-800 pb-4 pt-3 md:hidden">
            <div className="flex flex-col gap-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={
                    isActive(item.href)
                      ? "rounded-xl bg-white px-4 py-3 text-sm font-medium text-black"
                      : "rounded-xl px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-3 flex flex-col gap-1 border-t border-zinc-800 pt-3">
                {switchLink && (
                  <Link
                    href={switchLink.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  >
                    {switchLink.label} →
                  </Link>
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
