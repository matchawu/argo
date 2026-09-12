import StudentManager from "@/components/StudentManager";
import { supabase } from "@/lib/supabase";

export default async function StudentsPage() {
  const { data, error } = await supabase
    .from("students")
    .select("id, name, active")
    .order("name");

  if (error) {
    return (
      <main className="p-10">
        <h1>讀取學生失敗</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <StudentManager
      initialStudents={data ?? []}
    />
  );
}