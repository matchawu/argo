import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "我的學生",
};

export default async function TeacherStudentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, teacher_id")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    // 老師，或有綁定老師身份的 admin（老闆也是老師）
    !["teacher", "admin"].includes(profile.role) ||
    !profile.teacher_id
  ) {
    redirect("/");
  }

  /*
   * 明確篩選和這位老師有課的學生。
   * 老師本來就會被 RLS 過濾，但 admin 可以讀全部學生，老師模式下要自己篩。
   */
  const { data: teacherLessons, error: lessonsError } = await supabase
    .from("lessons")
    .select("student_id")
    .eq("teacher_id", profile.teacher_id);

  const studentIds = [
    ...new Set(
      (teacherLessons ?? [])
        .map((lesson) => lesson.student_id)
        .filter((id): id is number => id !== null),
    ),
  ];

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select(
      `
      id,
      name,
      active
    `,
    )
    .in("id", studentIds)
    .eq("active", true)
    .order("name");

  const error = lessonsError ?? studentsError;

  if (error) {
    return (
      <main className="min-h-screen text-foreground">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold">我的學生</h1>

          <div className="mt-8 rounded-2xl border border-danger/30 bg-danger-soft p-5 text-danger">
            讀取學生資料失敗：{error.message}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">我的學生</h1>

          <p className="mt-2 text-sm text-muted">
            顯示目前與你有課程關聯的學生
          </p>
        </div>

        {!students || students.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
            目前沒有學生
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/teacher/students/${student.id}`}
                className="block rounded-2xl border border-line bg-surface p-5 transition hover:border-line-strong hover:bg-fill"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{student.name}</div>

                    <div className="mt-1 text-sm text-muted">
                      學生編號 #{student.id}
                    </div>
                  </div>

                  <ChevronRight aria-hidden className="h-5 w-5 text-subtle" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
