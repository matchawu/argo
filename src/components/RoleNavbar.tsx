"use client";

import { ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import Logo from "@/components/Logo";

type NavItem = {
  label: string;
  href: string;
};

type Props = {
  /** 字標旁的身份標籤，例如 Teacher / Student */
  roleLabel: string;
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
  roleLabel,
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
    <nav className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link
            href={homeHref}
            onClick={() => setMenuOpen(false)}
            className="flex shrink-0 items-baseline gap-3"
          >
            <Logo size="sm" />

            <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              {roleLabel}
            </span>
          </Link>

          {/* Desktop */}
          <div className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive(item.href)
                    ? "whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-on-primary"
                    : "whitespace-nowrap rounded-full px-4 py-2 text-sm text-muted transition hover:bg-fill hover:text-foreground"
                }
              >
                {item.label}
              </Link>
            ))}

            {switchLink && (
              <Link
                href={switchLink.href}
                className="ml-2 whitespace-nowrap rounded-full border border-line-strong px-4 py-2 text-sm text-foreground transition hover:bg-fill"
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
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-foreground transition hover:bg-fill md:hidden"
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
          <div className="border-t border-line pb-4 pt-3 md:hidden">
            <div className="flex flex-col gap-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={
                    isActive(item.href)
                      ? "rounded-xl bg-primary px-4 py-3 text-sm font-medium text-on-primary"
                      : "rounded-xl px-4 py-3 text-sm text-muted hover:bg-fill hover:text-foreground"
                  }
                >
                  {item.label}
                </Link>
              ))}

              <div className="mt-3 flex flex-col gap-1 border-t border-line pt-3">
                {switchLink && (
                  <Link
                    href={switchLink.href}
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex items-center gap-1 rounded-xl px-4 py-3 text-sm text-foreground hover:bg-fill"
                  >
                    {switchLink.label}
                    <ChevronRight aria-hidden className="h-4 w-4 shrink-0" />
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
