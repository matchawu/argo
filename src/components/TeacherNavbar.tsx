import RoleNavbar from "@/components/RoleNavbar";

const navItems = [
  {
    label: "今日課程",
    href: "/teacher",
  },
  {
    label: "本週課表",
    href: "/teacher/week",
  },
  {
    label: "我的學生",
    href: "/teacher/students",
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
