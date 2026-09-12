import type { Metadata } from "next";
import EnrollmentList from "@/components/EnrollmentList";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "固定課程",
};

export default async function EnrollmentsPage() {

  const supabase = await createClient();
  
  const [
    { data: enrollments, error: enrollmentsError },
    { data: students, error: studentsError },
    { data: teachers, error: teachersError },
  ] = await Promise.all([
    supabase
      .from("enrollments")
      .select(`
        *,
        students (
          name
        ),
        teachers (
          name,
          teacher_share
        )
      `)
      .eq("active", true),

    supabase
      .from("students")
      .select("id, name")
      .eq("active", true)
      .order("name"),

    supabase
      .from("teachers")
      .select("id, name, teacher_share")
      .eq("active", true)
      .order("name"),
  ]);

  if (
    enrollmentsError ||
    studentsError ||
    teachersError
  ) {
    return (
      <main className="p-10">
        <h1>讀取資料失敗</h1>
      </main>
    );
  }

  return (
    <EnrollmentList
      enrollments={enrollments ?? []}
      students={students ?? []}
      teachers={teachers ?? []}
    />
  );
}