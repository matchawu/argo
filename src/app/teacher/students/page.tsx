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
    profile.role !== "teacher" ||
    !profile.teacher_id
  ) {
    redirect("/");
  }

  const { data: students, error } = await supabase
    .from("students")
    .select(
      `
      id,
      name,
      active
    `,
    )
    .eq("active", true)
    .order("name");

  if (error) {
    return (
      <main className="min-h-screen text-zinc-100">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold">我的學生</h1>

          <div className="mt-8 rounded-2xl border border-red-900 bg-red-950/30 p-5 text-red-300">
            讀取學生資料失敗：{error.message}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">我的學生</h1>

          <p className="mt-2 text-sm text-zinc-500">
            顯示目前與你有課程關聯的學生
          </p>
        </div>

        {!students || students.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
            目前沒有學生
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/teacher/students/${student.id}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700 hover:bg-zinc-800/70"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">{student.name}</div>

                    <div className="mt-1 text-sm text-zinc-500">
                      學生編號 #{student.id}
                    </div>
                  </div>

                  <span className="text-zinc-600">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
