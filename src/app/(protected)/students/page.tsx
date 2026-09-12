import StudentManager from "@/components/StudentManager";
import { createClient } from "@/lib/supabase/server";

export default async function StudentsPage() {
  
  const supabase = await createClient();
  
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