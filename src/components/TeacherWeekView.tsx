"use client";

import Link from "next/link";
import {
  addDays,
  formatLocalDate,
  parseLocalDate,
} from "@/lib/date";

type TeacherLesson = {
  id: number;
  student: string;
  course: string;
  date: string;
  time: string;
  status:
    | "scheduled"
    | "completed"
    | "cancelled";
};

type Props = {
  lessons: TeacherLesson[];
  startDate: string;
  endDate: string;
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

const statusLabel = {
  scheduled: "待上課",
  completed: "已完成",
  cancelled: "已取消",
};

const statusClassName = {
  scheduled:
    "border border-amber-500/30 bg-amber-500/10 text-amber-300",
  completed:
    "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelled:
    "border border-zinc-700 bg-zinc-800 text-zinc-500",
};

export default function TeacherWeekView({
  lessons,
  startDate,
  endDate,
}: Props) {
  const days = Array.from(
    { length: 7 },
    (_, index) => addDays(startDate, index),
  );

  const previousWeek = addDays(startDate, -7);
  const nextWeek = addDays(startDate, 7);

  const today = formatLocalDate(new Date());

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              我的本週課表
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              {startDate} ～ {endDate}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/teacher/week?date=${previousWeek}`}
              className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
            >
              ← 上週
            </Link>

            <Link
              href="/teacher/week"
              className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
            >
              本週
            </Link>

            <Link
              href={`/teacher/week?date=${nextWeek}`}
              className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
            >
              下週 →
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {days.map((date) => {
            const lessonsForDay = lessons.filter(
              (lesson) =>
                lesson.date === date,
            );

            const parsedDate =
              parseLocalDate(date);

            const isToday =
              date === today;

            return (
              <section
                key={date}
                className={
                  isToday
                    ? "rounded-2xl border border-zinc-600 bg-zinc-900 p-5"
                    : "rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
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

                  <span className="text-sm text-zinc-500">
                    {date}
                  </span>

                  {isToday && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-black">
                      今天
                    </span>
                  )}

                  <span className="ml-auto text-xs text-zinc-600">
                    {lessonsForDay.length} 堂
                  </span>
                </div>

                {lessonsForDay.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 px-4 py-5 text-sm text-zinc-600">
                    這天沒有課程
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessonsForDay.map(
                      (lesson) => (
                        <Link
                          key={lesson.id}
                          href={`/teacher?date=${lesson.date}`}
                          className={
                            lesson.status ===
                            "cancelled"
                              ? "flex items-center justify-between gap-4 rounded-xl bg-zinc-950/50 px-4 py-3 opacity-60 transition hover:bg-zinc-800"
                              : "flex items-center justify-between gap-4 rounded-xl bg-zinc-950 px-4 py-3 transition hover:bg-zinc-800"
                          }
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <span
                              className={
                                lesson.status ===
                                "cancelled"
                                  ? "w-14 shrink-0 font-medium text-zinc-600 line-through"
                                  : "w-14 shrink-0 font-medium"
                              }
                            >
                              {lesson.time}
                            </span>

                            <div className="min-w-0">
                              <div
                                className={
                                  lesson.status ===
                                  "cancelled"
                                    ? "truncate text-zinc-500 line-through"
                                    : "truncate"
                                }
                              >
                                {lesson.student}
                              </div>

                              <div className="mt-1 truncate text-sm text-zinc-500">
                                {lesson.course}
                              </div>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                              statusClassName[
                                lesson.status
                              ]
                            }`}
                          >
                            {
                              statusLabel[
                                lesson.status
                              ]
                            }
                          </span>
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}