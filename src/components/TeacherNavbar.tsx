"use client";

import { CalendarCheck, CalendarDays, Users } from "lucide-react";
import RoleNavbar, { type NavItem } from "@/components/RoleNavbar";

const navItems: NavItem[] = [
  {
    label: "今日課程",
    href: "/teacher",
    icon: CalendarCheck,
  },
  {
    label: "本週課表",
    href: "/teacher/week",
    icon: CalendarDays,
  },
  {
    label: "我的學生",
    href: "/teacher/students",
    icon: Users,
  },
];

export default function TeacherNavbar({
  showAdminLink = false,
}: {
  showAdminLink?: boolean;
}) {
  return (
    <RoleNavbar
      roleLabel="Teacher"
      homeHref="/teacher"
      items={navItems}
      switchLink={
        showAdminLink
          ? { label: "管理後台", href: "/" }
          : undefined
      }
    />
  );
}
