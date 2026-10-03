"use client";

import { CalendarDays, NotebookPen, Wallet } from "lucide-react";
import RoleNavbar, { type NavItem } from "@/components/RoleNavbar";

const navItems: NavItem[] = [
  {
    label: "本週課表",
    href: "/student",
    icon: CalendarDays,
  },
  {
    label: "繳費與堂數",
    href: "/student/payments",
    icon: Wallet,
  },
  {
    label: "上課紀錄",
    href: "/student/lessons",
    icon: NotebookPen,
  },
];

export default function StudentNavbar() {
  return (
    <RoleNavbar
      roleLabel="Student"
      homeHref="/student"
      items={navItems}
    />
  );
}
