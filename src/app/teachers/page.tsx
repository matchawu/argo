import TeacherManager from "@/components/TeacherManager";
import { supabase } from "@/lib/supabase";

export default async function TeachersPage() {
  const { data, error } = await supabase
    .from("teachers")
    .select("id, name, teacher_share, active")
    .order("name");

  if (error) {
    return (
      <main className="p-10">
        <h1>讀取老師失敗</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <TeacherManager
      initialTeachers={data ?? []}
    />
  );
}