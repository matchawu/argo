import StudentNavbar from "@/components/StudentNavbar";
import { getCurrentStudent } from "@/lib/currentStudent";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getCurrentStudent();

  return (
    <>
      <StudentNavbar />
      {/* 手機底部分頁列的空間 */}
      <div className="pb-24 md:pb-0">{children}</div>
    </>
  );
}
