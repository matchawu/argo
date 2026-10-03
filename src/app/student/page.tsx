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
      <main className="p-10">
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

  const weekLabel = `${weekStart.slice(5).replace("-", "/")} – ${weekEnd
    .slice(5)
    .replace("-", "/")}`;

  const isThisWeek = today >= weekStart && today <= weekEnd;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-subtle">
          {isThisWeek ? "This Week" : "Schedule"}
        </p>

        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          {student.name}，你好
        </h1>

        {activeBalances.length > 0 && (
          <Link
            href="/student/payments"
            className="mt-6 block rounded-3xl border border-line bg-surface p-5 shadow-card transition hover:border-line-strong sm:p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">剩餘堂數</p>

              <span className="text-xs text-subtle">繳費紀錄 →</span>
            </div>

            <div className="mt-4 space-y-4">
              {activeBalances.map((enrollment) => (
                <div
                  key={enrollment.enrollmentId}
                  className="flex items-end justify-between gap-4"
                >
                  <span className="text-sm text-foreground">
                    {enrollmentLabel(enrollment)}
                  </span>

                  <span className="shrink-0 font-display leading-none">
                    <span
                      className={`text-4xl font-bold ${remainingClassName(
                        enrollment.remaining,
                      )}`}
                    >
                      {enrollment.remaining}
                    </span>

                    <span className="ml-1 text-base font-medium text-subtle">
                      / {enrollment.purchased}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Link>
        )}

        <div className="mt-10 flex items-center justify-between gap-3">
          <Link
            href={weekHref(addDays(weekStart, -7))}
            aria-label="上一週"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:text-foreground"
          >
            ←
          </Link>

          <div className="text-center">
            <h2 className="font-display text-xl font-bold tracking-wide">
              {weekLabel}
            </h2>

            {!isThisWeek && (
              <Link
                href={weekHref()}
                className="text-xs text-muted underline hover:text-foreground"
              >
                回到本週
              </Link>
            )}
          </div>

          <Link
            href={weekHref(addDays(weekStart, 7))}
            aria-label="下一週"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-muted transition hover:text-foreground"
          >
            →
          </Link>
        </div>

        <div className="mt-5 flex justify-center">
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
          <div className="mt-6 rounded-3xl border border-dashed border-line-strong p-10 text-center text-sm text-muted">
            這週沒有排課
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {days.map((day) => (
              <section key={day.date}>
                <h3
                  className={`mb-2 flex items-center gap-2 text-sm ${
                    day.date === today
                      ? "font-semibold text-foreground"
                      : "text-muted"
                  }`}
                >
                  <span className="font-display font-semibold">
                    {day.date.slice(5).replace("-", "/")}
                  </span>
                  {weekdayNames[parseLocalDate(day.date).getDay()]}
                  {day.date === today && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-on-primary">
                      今天
                    </span>
                  )}
                </h3>

                <div className="space-y-2">
                  {day.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`flex items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-4 shadow-card ${
                        lesson.status === "cancelled" ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-display text-lg font-bold">
                          {lesson.lesson_time.slice(0, 5)}
                        </span>

                        <div>
                          <div className="font-medium">{lesson.course}</div>

                          <div className="mt-0.5 text-sm text-muted">
                            {lesson.teacher} 老師
                          </div>
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
