"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  ArrowLeftRight,
  Calculator,
  CalendarCheck,
  CalendarDays,
  GraduationCap,
  Menu,
  Repeat,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import Logo from "@/components/Logo";

const navItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "今日課程", href: "/", icon: CalendarCheck },
  { label: "本週課表", href: "/week", icon: CalendarDays },
  { label: "固定課程", href: "/enrollments", icon: Repeat },
  { label: "學生", href: "/students", icon: GraduationCap },
  { label: "老師", href: "/teachers", icon: Users },
  { label: "月結", href: "/settlement", icon: Calculator },
  { label: "健檢", href: "/health", icon: Activity },
];

type Props = {
  email: string | null;
  showTeacherLink?: boolean;
};

/*
 * 管理後台導覽
 *
 * 桌面（lg 以上）：左側固定側欄，layout 用 lg:pl-60 讓出空間
 * 手機 / 平板：上方列 + 漢堡選單
 */
function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex items-center gap-3 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-on-primary"
                : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-fill hover:text-foreground"
            }
          >
            <Icon aria-hidden className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

function AccountSection({
  email,
  showTeacherLink,
  onNavigate,
}: Props & { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col gap-1 border-t border-line pt-3">
      {showTeacherLink && (
        <Link
          href="/teacher"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition hover:bg-fill"
        >
          <ArrowLeftRight aria-hidden className="h-[18px] w-[18px]" />
          老師模式
        </Link>
      )}

      {email && (
        <p className="truncate px-3 pt-1 text-xs text-subtle">{email}</p>
      )}

      <LogoutButton />
    </div>
  );
}

export default function Navbar({ email, showTeacherLink = false }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* 桌面：左側欄 */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        <Link
          href="/"
          className="flex h-16 shrink-0 items-baseline gap-3 px-6 pt-6"
        >
          <Logo size="sm" />

          <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            Admin
          </span>
        </Link>

        <nav aria-label="管理後台" className="mt-6 flex-1 overflow-y-auto px-3">
          <NavLinks pathname={pathname} />
        </nav>

        <div className="px-3 pb-4">
          <AccountSection email={email} showTeacherLink={showTeacherLink} />
        </div>
      </aside>

      {/* 手機 / 平板：上方列 */}
      <nav className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="flex shrink-0 items-baseline gap-3"
          >
            <Logo size="sm" />

            <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              Admin
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-foreground transition hover:bg-fill"
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

        {menuOpen && (
          <div className="space-y-3 border-t border-line px-3 pb-4 pt-3">
            <NavLinks
              pathname={pathname}
              onNavigate={() => setMenuOpen(false)}
            />
            <AccountSection
              email={email}
              showTeacherLink={showTeacherLink}
              onNavigate={() => setMenuOpen(false)}
            />
          </div>
        )}
      </nav>
    </>
  );
}
