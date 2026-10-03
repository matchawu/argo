import type { Metadata } from "next";
import { getCurrentStudent } from "@/lib/currentStudent";
import {
  lessonStatusClassName,
  lessonStatusLabel,
} from "@/lib/lessonStatus";
import type { LessonStatus } from "@/types/lesson";

export const metadata: Metadata = {
  title: "上課紀錄",
};

export default async function StudentLessonsPage() {
  const { admin, student } = await getCurrentStudent();

  /*
   * 只顯示已完成 / 已取消的課。
   * 不讀 lesson_note（老師內部紀錄）。
   */
  const { data: lessons, error } = await admin
    .from("lessons")
    .select(
      "id, teacher, course, lesson_date, lesson_time, status, student_note",
    )
    .eq("student_id", student.id)
    .in("status", ["completed", "cancelled"])
    .order("lesson_date", { ascending: false })
    .order("lesson_time", { ascending: false });

  if (error) {
    return (
      <main className="p-10">
        <h1>讀取上課紀錄失敗</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  const history = lessons ?? [];

  const completedCount = history.filter(
    (lesson) => lesson.status === "completed",
  ).length;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-subtle">
          History
        </p>

        <div className="mt-2 flex items-end justify-between gap-4">
          <h1 className="text-2xl font-semibold sm:text-3xl">上課紀錄</h1>

          <span className="text-sm text-muted">
            已上課
            <span className="mx-1 font-display text-2xl font-bold text-foreground">
              {completedCount}
            </span>
            堂
          </span>
        </div>

        {history.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-line-strong p-10 text-center text-sm text-muted">
            目前沒有上課紀錄
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {history.map((lesson) => (
              <article
                key={lesson.id}
                className={`rounded-3xl border border-line bg-surface p-5 shadow-card ${
                  lesson.status === "cancelled" ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-lg font-bold">
                        {lesson.lesson_date.replaceAll("-", ".")}
                      </span>

                      <span className="font-display text-sm font-semibold text-muted">
                        {lesson.lesson_time.slice(0, 5)}
                      </span>
                    </div>

                    <div className="mt-0.5 text-sm text-muted">
                      {lesson.course} · {lesson.teacher} 老師
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      lessonStatusClassName[lesson.status as LessonStatus]
                    }`}
                  >
                    {lessonStatusLabel[lesson.status as LessonStatus]}
                  </span>
                </div>

                {lesson.student_note && (
                  <blockquote className="mt-4 border-l-2 border-foreground pl-4">
                    <p className="text-xs font-medium text-subtle">老師的紀錄</p>

                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-foreground">
                      {lesson.student_note}
                    </p>
                  </blockquote>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
