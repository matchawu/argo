"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";

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
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);

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

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="shrink-0 text-xl font-bold tracking-tight"
        >
          Argo
        </Link>

        <div className="flex items-center gap-2">
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
            <span className="ml-3 hidden max-w-44 truncate text-xs text-zinc-500 lg:block">
              {email}
            </span>
          )}

          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}