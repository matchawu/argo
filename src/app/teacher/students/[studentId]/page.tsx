import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeacherStudentNote from "@/components/TeacherStudentNote";
import TeacherLessonHistory from "@/components/TeacherLessonHistory";

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
  scheduled: "border border-warning/30 bg-warning-soft text-warning",
  completed: "border border-success/30 bg-success-soft text-success",
  cancelled: "border border-line-strong bg-fill text-muted",
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
    // 老師，或有綁定老師身份的 admin（老闆也是老師）
    !["teacher", "admin"].includes(profile.role) ||
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
      status,
      lesson_note,
      student_note
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
      <main className="min-h-screen text-foreground">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold">{student.name}</h1>

          <div className="mt-8 rounded-2xl border border-danger/30 bg-danger-soft p-5 text-danger">
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
    <main className="min-h-screen text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          href="/teacher/students"
          className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="h-4 w-4 shrink-0" />
          返回我的學生
        </Link>

        <div className="mt-6">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{student.name}</h1>

            {!student.active && (
              <span className="rounded-full bg-fill px-2.5 py-1 text-xs text-muted">
                已停用
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-muted">我和這位學生的上課紀錄</p>
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

            <span className="text-sm text-muted">
              共 {studentLessons.length} 堂
            </span>
          </div>

          {studentLessons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
              目前沒有課程紀錄
            </div>
          ) : (
            <TeacherLessonHistory
              studentName={student.name}
              initialLessons={studentLessons}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-muted">{title}</p>

      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
