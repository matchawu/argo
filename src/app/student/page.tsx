import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentStudent } from "@/lib/currentStudent";
import { enrollmentLabel, getLessonBalance } from "@/lib/lessonBalance";
import { remainingClassName } from "@/components/LessonBalanceCards";
import {
  addDays,
  getTodayInTaiwan,
  getWeekStart,
  parseLocalDate,
} from "@/lib/date";
import {
  lessonStatusClassName,
  lessonStatusLabel,
} from "@/lib/lessonStatus";
import type { LessonStatus } from "@/types/lesson";
import WeekCalendar, {
  WeekViewToggle,
  parseWeekView,
} from "@/components/WeekCalendar";

export const metadata: Metadata = {
  title: "本週課表",
};

type Props = {
  searchParams: Promise<{
    date?: string;
    view?: string;
  }>;
};

const weekdayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

export default async function StudentWeekPage({ searchParams }: Props) {
  const { admin, student } = await getCurrentStudent();

  const params = await searchParams;

  const today = getTodayInTaiwan();

  const weekStart = getWeekStart(
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : today,
  );

  const weekEnd = addDays(weekStart, 6);

  const view = parseWeekView(params.view);

  function weekHref(date?: string) {
    const query = [
      date ? `date=${date}` : "",
      view === "list" ? "view=list" : "",
    ]
      .filter(Boolean)
      .join("&");

    return query ? `/student?${query}` : "/student";
  }

  const [{ data: lessons, error }, balance] = await Promise.all([
    admin
      .from("lessons")
      .select("id, teacher, course, lesson_date, lesson_time, status")
      .eq("student_id", student.id)
      .gte("lesson_date", weekStart)
      .lte("lesson_date", weekEnd)
      .order("lesson_date", { ascending: true })
      .order("lesson_time", { ascending: true }),

    getLessonBalance(admin, student.id),
  ]);

  if (error) {
    return (
      <main className="p-10 text-zinc-100">
        <h1>讀取課表失敗</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  const activeBalances = balance.enrollments.filter(
    (enrollment) => enrollment.active,
  );

  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index),
  )
    .map((date) => ({
      date,
      lessons: (lessons ?? []).filter(
        (lesson) => lesson.lesson_date === date,
      ),
    }))
    .filter((day) => day.lessons.length > 0);

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {activeBalances.length > 0 && (
          <Link
            href="/student/payments"
            className="block rounded-2xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700"
          >
            <p className="text-sm text-zinc-500">剩餘堂數</p>

            <div className="mt-2 space-y-2">
              {activeBalances.map((enrollment) => (
                <div
                  key={enrollment.enrollmentId}
                  className="flex items-baseline justify-between gap-4"
                >
                  <span className="text-sm text-zinc-300">
                    {enrollmentLabel(enrollment)}
                  </span>

                  <span
                    className={`shrink-0 text-2xl font-semibold ${remainingClassName(
                      enrollment.remaining,
                    )}`}
                  >
                    {enrollment.remaining}
                    <span className="ml-1 text-sm font-normal text-zinc-500">
                      / {enrollment.purchased} 堂
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Link>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Link
            href={weekHref(addDays(weekStart, -7))}
            className="rounded-xl px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            ← 上週
          </Link>

          <div className="text-center">
            <h1 className="text-xl font-semibold">
              {weekStart.slice(5).replace("-", "/")} –{" "}
              {weekEnd.slice(5).replace("-", "/")}
            </h1>

            {!(today >= weekStart && today <= weekEnd) && (
              <Link
                href={weekHref()}
                className="text-xs text-zinc-500 underline hover:text-zinc-300"
              >
                回到本週
              </Link>
            )}
          </div>

          <Link
            href={weekHref(addDays(weekStart, 7))}
            className="rounded-xl px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
          >
            下週 →
          </Link>
        </div>

        <div className="mt-4 flex justify-center">
          <WeekViewToggle basePath="/student" date={weekStart} view={view} />
        </div>

        {view === "calendar" ? (
          <div className="mt-6">
            <WeekCalendar
              startDate={weekStart}
              lessons={(lessons ?? []).map((lesson) => ({
                id: lesson.id,
                date: lesson.lesson_date,
                time: lesson.lesson_time.slice(0, 5),
                title: lesson.course,
                subtitle: `${lesson.teacher} 老師`,
                status: lesson.status as LessonStatus,
              }))}
            />
          </div>
        ) : days.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
            這週沒有排課
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {days.map((day) => (
              <section key={day.date}>
                <h2
                  className={`mb-2 text-sm font-medium ${
                    day.date === today ? "text-white" : "text-zinc-500"
                  }`}
                >
                  {day.date.slice(5).replace("-", "/")}{" "}
                  {weekdayNames[parseLocalDate(day.date).getDay()]}
                  {day.date === today && " · 今天"}
                </h2>

                <div className="space-y-2">
                  {day.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 ${
                        lesson.status === "cancelled" ? "opacity-60" : ""
                      }`}
                    >
                      <div>
                        <div className="font-medium">
                          {lesson.lesson_time.slice(0, 5)} · {lesson.course}
                        </div>

                        <div className="mt-1 text-sm text-zinc-500">
                          {lesson.teacher} 老師
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
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
