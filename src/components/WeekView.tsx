"use client";

import Link from "next/link";
import type { Lesson } from "@/types/lesson";
import {
  addDays,
  parseLocalDate,
} from "@/lib/date";

type Props = {
  lessons: Lesson[];
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

export default function WeekView({
  lessons,
  startDate,
  endDate,
}: Props) {
  const days = Array.from(
    { length: 7 },
    (_, index) => addDays(startDate, index)
  );

  const previousWeek = addDays(startDate, -7);
  const nextWeek = addDays(startDate, 7);

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-10">

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              本週課表
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              {startDate} ～ {endDate}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/week?date=${previousWeek}`}
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              ← 上週
            </Link>

            <Link
              href="/week"
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              本週
            </Link>

            <Link
              href={`/week?date=${nextWeek}`}
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              下週 →
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {days.map((date) => {
            const lessonsForDay = lessons.filter(
              (lesson) => lesson.date === date
            );

            const parsedDate = parseLocalDate(date);

            return (
              <section
                key={date}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
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
                </div>

                {lessonsForDay.length === 0 ? (
                  <p className="text-sm text-zinc-600">
                    無課程
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lessonsForDay.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between rounded-xl bg-zinc-950 px-4 py-3"
                      >
                        <div className="flex items-center gap-4">
                          <span className="w-14 font-medium">
                            {lesson.time}
                          </span>

                          <div>
                            <div>
                              {lesson.student}
                            </div>

                            <div className="text-sm text-zinc-500">
                              {lesson.course}
                              {" · "}
                              {lesson.teacher}
                            </div>
                          </div>
                        </div>

                        <span className="text-sm text-zinc-500">
                          {lesson.status}
                        </span>
                      </div>
                    ))}
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