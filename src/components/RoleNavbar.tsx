"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, type LucideIcon } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import Logo from "@/components/Logo";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type Props = {
  /** 字標旁的身份標籤，例如 Teacher / Student */
  roleLabel: string;
  homeHref: string;
  items: NavItem[];
  /*
   * 切換到另一個身份的入口（例如老闆從老師模式回到管理後台）
   */
  switchLink?: { label: string; href: string };
};

/*
 * 老師 / 學生共用 navbar
 *
 * 桌面：上方單列
 * 手機：上方只有字標 + 登出，頁面切換在底部分頁列（像一般 App）
 *
 * 搭配 layout 在手機上給內容留出底部空間（pb-24 md:pb-0）。
 */
export default function RoleNavbar({
  roleLabel,
  homeHref,
  items,
  switchLink,
}: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === homeHref
      ? pathname === homeHref
      : pathname.startsWith(href);
  }

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href={homeHref} className="flex shrink-0 items-baseline gap-3">
            <Logo size="sm" />

            <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              {roleLabel}
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {/* 桌面：頁面連結 */}
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
            </div>

            {switchLink && (
              <Link
                href={switchLink.href}
                className="ml-1 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line-strong px-3 py-2 text-sm text-foreground transition hover:bg-fill md:px-4"
              >
                <ArrowLeftRight aria-hidden className="h-4 w-4" />
                {switchLink.label}
              </Link>
            )}

            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* 手機：底部分頁列 */}
      <nav
        aria-label="主要頁面"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div
          className="mx-auto grid max-w-md"
          style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
        >
          {items.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] transition ${
                  active ? "font-semibold text-foreground" : "text-subtle"
                }`}
              >
                <Icon
                  aria-hidden
                  className="h-6 w-6"
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
