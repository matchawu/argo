import RoleNavbar from "@/components/RoleNavbar";

const navItems = [
  {
    label: "本週課表",
    href: "/student",
  },
  {
    label: "繳費與堂數",
    href: "/student/payments",
  },
  {
    label: "上課紀錄",
    href: "/student/lessons",
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
