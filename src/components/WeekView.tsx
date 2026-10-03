"use client";

import Link from "next/link";
import type { Lesson } from "@/types/lesson";
import WeekCalendar, { WeekViewToggle } from "@/components/WeekCalendar";
import {
  addDays,
  formatLocalDate,
  parseLocalDate,
  getTodayInTaiwan
} from "@/lib/date";
import {
  lessonStatusClassName,
  lessonStatusLabel,
} from "@/lib/lessonStatus";

type Props = {
  lessons: Lesson[];
  startDate: string;
  endDate: string;
  view: "list" | "calendar";
};

const weekdayNames = [
  "週日",
  "週一",
  "週二",
  "週三",
  "週四",
  "週五",
  "週六",
];

export default function WeekView({
  lessons,
  startDate,
  endDate,
  view,
}: Props) {
  const days = Array.from(
    { length: 7 },
    (_, index) => addDays(startDate, index)
  );

  const previousWeek = addDays(startDate, -7);
  const nextWeek = addDays(startDate, 7);

  const viewQuery = view === "list" ? "view=list" : "";

  function weekHref(date?: string) {
    const query = [date ? `date=${date}` : "", viewQuery]
      .filter(Boolean)
      .join("&");

    return query ? `/week?${query}` : "/week";
  }

  const today = getTodayInTaiwan();

  return (
    <main className="min-h-screen text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              本週課表
            </h1>

            <p className="mt-2 text-sm text-muted">
              {startDate} ～ {endDate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <WeekViewToggle
              basePath="/week"
              date={startDate}
              view={view}
            />

            <Link
              href={weekHref(previousWeek)}
              className="rounded-xl bg-fill px-4 py-2 text-sm transition hover:bg-fill-strong"
            >
              ← 上週
            </Link>

            <Link
              href={weekHref()}
              className="rounded-xl bg-fill px-4 py-2 text-sm transition hover:bg-fill-strong"
            >
              本週
            </Link>

            <Link
              href={weekHref(nextWeek)}
              className="rounded-xl bg-fill px-4 py-2 text-sm transition hover:bg-fill-strong"
            >
              下週 →
            </Link>
          </div>
        </div>

        {view === "calendar" ? (
          <WeekCalendar
            startDate={startDate}
            lessons={lessons.map((lesson) => ({
              id: lesson.id,
              date: lesson.date,
              time: lesson.time,
              title: lesson.student,
              subtitle: `${lesson.course} · ${lesson.teacher}`,
              status: lesson.status,
              href: `/?date=${lesson.date}`,
            }))}
          />
        ) : (
        <div className="space-y-4">
          {days.map((date) => {
            const lessonsForDay = lessons.filter(
              (lesson) => lesson.date === date
            );

            const parsedDate = parseLocalDate(date);
            const isToday = date === today;

            return (
              <section
                key={date}
                className={
                  isToday
                    ? "rounded-2xl border border-line-strong bg-surface p-5"
                    : "rounded-2xl border border-line bg-surface p-5"
                }
              >
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-lg font-semibold">
                    {
                      weekdayNames[
                        parsedDate.getDay()
                      ]
                    }
                  </h2>

                  <span className="text-sm text-muted">
                    {date}
                  </span>

                  {isToday && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-on-primary">
                      今天
                    </span>
                  )}
                </div>

                {lessonsForDay.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line px-4 py-5 text-sm text-subtle">
                    今天沒有課程
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessonsForDay.map((lesson) => {
                      const isCancelled =
                        lesson.status === "cancelled";

                      return (
                        <div
                          key={lesson.id}
                          className={
                            isCancelled
                              ? "flex items-center justify-between gap-4 rounded-xl bg-fill/50 px-4 py-3 opacity-60"
                              : "flex items-center justify-between gap-4 rounded-xl bg-background px-4 py-3"
                          }
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <span
                              className={
                                isCancelled
                                  ? "w-14 shrink-0 font-medium text-subtle line-through"
                                  : "w-14 shrink-0 font-medium"
                              }
                            >
                              {lesson.time}
                            </span>

                            <div className="min-w-0">
                              <div
                                className={
                                  isCancelled
                                    ? "truncate text-muted line-through"
                                    : "truncate"
                                }
                              >
                                {lesson.student}
                              </div>

                              <div className="truncate text-sm text-muted">
                                {lesson.course}
                                {" · "}
                                {lesson.teacher}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                              lessonStatusClassName[
                                lesson.status
                              ]
                            }`}
                          >
                            {
                              lessonStatusLabel[
                                lesson.status
                              ]
                            }
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
        )}
      </div>
    </main>
  );
}