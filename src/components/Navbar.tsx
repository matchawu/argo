"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "今日課程",
    href: "/",
  },
  {
    label: "本週課表",
    href: "/week",
  },
  {
    label: "固定課程",
    href: "/enrollments",
  },
  {
    label: "學生",
    href: "/students",
  },
  {
    label: "老師",
    href: "/teachers",
  },
  {
    label: "月結",
    href: "/settlement",
  }
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Argo
        </Link>

        <div className="flex gap-2">
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
        </div>
      </div>
    </nav>
  );
}
