import type { Metadata } from "next";
import TeacherManager from "@/components/TeacherManager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "老師",
};

export default async function TeachersPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("teachers")
    .select("id, name, email, teacher_share, active, invite_status, invited_at")
    .order("name");

  if (error) {
    return (
      <main className="p-10">
        <h1>讀取老師失敗</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return <TeacherManager initialTeachers={data ?? []} />;
}
