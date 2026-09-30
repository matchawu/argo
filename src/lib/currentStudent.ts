import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/*
 * 學生頁用：取得目前登入的學生。
 *
 * 不是學生就導走。
 * 之後的查詢一律用 admin client + 這裡回傳的 student.id 過濾，
 * 不依賴 RLS。
 */
export const getCurrentStudent = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role, student_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "student" || !profile.student_id) {
    redirect("/");
  }

  const { data: student } = await admin
    .from("students")
    .select("id, name, active")
    .eq("id", profile.student_id)
    .maybeSingle();

  if (!student?.active) {
    redirect("/login?error=student_inactive");
  }

  return {
    admin,
    student: {
      id: student.id as number,
      name: student.name as string,
    },
  };
});
