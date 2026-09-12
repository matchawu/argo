"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
  {
    label: "今日課程",
    href: "/teacher",
  },
  {
    label: "我的學生",
    href: "/teacher/students",
  },
];

export default function TeacherNavbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/teacher"
          className="text-xl font-bold tracking-tight"
        >
          Argo Teacher
        </Link>

        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/teacher"
                ? pathname === "/teacher"
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

          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}