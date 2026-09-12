import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeacherStudentNote from "@/components/TeacherStudentNote";

export const metadata: Metadata = {
  title: "學生詳情",
};

type Props = {
  params: Promise<{
    studentId: string;
  }>;
};

const statusLabel = {
  scheduled: "待上課",
  completed: "已完成",
  cancelled: "已取消",
};

const statusClassName = {
  scheduled: "border border-amber-500/30 bg-amber-500/10 text-amber-300",
  completed: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelled: "border border-zinc-700 bg-zinc-800 text-zinc-500",
};

export default async function TeacherStudentDetailPage({ params }: Props) {
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

  const { studentId } = await params;

  const numericStudentId = Number(studentId);

  if (Number.isNaN(numericStudentId)) {
    notFound();
  }

  const [
    { data: student, error: studentError },
    { data: lessons, error: lessonsError },
    { data: noteData, error: noteError },
  ] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, active")
      .eq("id", numericStudentId)
      .single(),

    supabase
      .from("lessons")
      .select(
        `
      id,
      course,
      lesson_date,
      lesson_time,
      price,
      status
    `,
      )
      .eq("student_id", numericStudentId)
      .eq("teacher_id", profile.teacher_id)
      .order("lesson_date", {
        ascending: false,
      })
      .order("lesson_time", {
        ascending: false,
      }),

    supabase
      .from("teacher_student_notes")
      .select("note")
      .eq("teacher_id", profile.teacher_id)
      .eq("student_id", numericStudentId)
      .maybeSingle(),
  ]);

  if (studentError || !student) {
    notFound();
  }

  if (lessonsError) {
    return (
      <main className="min-h-screen text-zinc-100">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold">{student.name}</h1>

          <div className="mt-8 rounded-2xl border border-red-900 bg-red-950/30 p-5 text-red-300">
            讀取課程紀錄失敗：{lessonsError.message}
          </div>
        </div>
      </main>
    );
  }

  if (noteError) {
    console.error(noteError);
  }

  const studentLessons = lessons ?? [];

  const completedCount = studentLessons.filter(
    (lesson) => lesson.status === "completed",
  ).length;

  const scheduledCount = studentLessons.filter(
    (lesson) => lesson.status === "scheduled",
  ).length;

  const cancelledCount = studentLessons.filter(
    (lesson) => lesson.status === "cancelled",
  ).length;

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          href="/teacher/students"
          className="text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          ← 返回我的學生
        </Link>

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{student.name}</h1>

            {!student.active && (
              <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-500">
                已停用
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-zinc-500">我和這位學生的上課紀錄</p>
        </div>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatCard title="已完成" value={completedCount} />

          <StatCard title="待上課" value={scheduledCount} />

          <StatCard title="已取消" value={cancelledCount} />
        </section>
        <TeacherStudentNote
          teacherId={profile.teacher_id}
          studentId={numericStudentId}
          initialNote={noteData?.note ?? ""}
        />

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">課程紀錄</h2>

            <span className="text-sm text-zinc-500">
              共 {studentLessons.length} 堂
            </span>
          </div>

          {studentLessons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
              目前沒有課程紀錄
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-800">
              {studentLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={
                    lesson.status === "cancelled"
                      ? "flex flex-col gap-3 border-b border-zinc-800 bg-zinc-950/40 p-5 opacity-60 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                      : "flex flex-col gap-3 border-b border-zinc-800 p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                  }
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{lesson.lesson_date}</span>

                      <span className="text-sm text-zinc-400">
                        {lesson.lesson_time.slice(0, 5)}
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-zinc-500">
                      {lesson.course}
                    </div>
                  </div>

                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                      statusClassName[
                        lesson.status as keyof typeof statusClassName
                      ]
                    }`}
                  >
                    {statusLabel[lesson.status as keyof typeof statusLabel]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-500">{title}</p>

      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
