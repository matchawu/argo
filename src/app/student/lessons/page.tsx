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
      <main className="p-10 text-zinc-100">
        <h1>讀取上課紀錄失敗</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  const history = lessons ?? [];

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">上課紀錄</h1>

          <span className="text-sm text-zinc-500">
            已上課{" "}
            {history.filter((lesson) => lesson.status === "completed").length}{" "}
            堂
          </span>
        </div>

        {history.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
            目前沒有上課紀錄
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
            {history.map((lesson) => (
              <div
                key={lesson.id}
                className={
                  lesson.status === "cancelled"
                    ? "border-b border-zinc-800 bg-zinc-950/40 p-5 opacity-60 last:border-b-0"
                    : "border-b border-zinc-800 p-5 last:border-b-0"
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{lesson.lesson_date}</span>

                      <span className="text-sm text-zinc-400">
                        {lesson.lesson_time.slice(0, 5)}
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-zinc-500">
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
                  <div className="mt-4 rounded-xl bg-zinc-950 px-4 py-3">
                    <p className="text-xs font-medium text-zinc-600">
                      老師的紀錄
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                      {lesson.student_note}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
