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
      {children}
    </>
  );
}
