import type { Metadata } from "next";
import TeacherManager from "@/components/TeacherManager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "老師",
};

export default async function TeachersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data, error }, { data: linkedProfiles }] = await Promise.all([
    supabase
      .from("teachers")
      .select("id, name, email, teacher_share, active, invite_status, invited_at")
      .order("name"),

    supabase
      .from("profiles")
      .select("id, teacher_id")
      .not("teacher_id", "is", null),
  ]);

  if (error) {
    return (
      <main className="p-10">
        <h1>讀取老師失敗</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  /*
   * 目前 admin 綁定的老師（老闆也是老師）
   */
  const myTeacherId =
    linkedProfiles?.find((profile) => profile.id === user?.id)
      ?.teacher_id ?? null;

  /*
   * 已經有自己登入帳號的老師（不能再綁到 admin）
   */
  const teacherIdsWithLogin = (linkedProfiles ?? [])
    .filter((profile) => profile.id !== user?.id)
    .map((profile) => profile.teacher_id as number);

  return (
    <TeacherManager
      initialTeachers={data ?? []}
      initialMyTeacherId={myTeacherId}
      teacherIdsWithLogin={teacherIdsWithLogin}
    />
  );
}
