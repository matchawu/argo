import TeacherNavbar from "@/components/TeacherNavbar";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TeacherNavbar />
      {children}
    </>
  );
}