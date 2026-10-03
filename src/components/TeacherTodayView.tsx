"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Lesson } from "@/types/lesson";

import CompleteLessonModal from "@/components/CompleteLessonModal";
import RescheduleModal from "@/components/RescheduleModal";
import CancelLessonModal from "@/components/CancelLessonModal";

import Link from "next/link";
import { addDays, formatLocalDate, parseLocalDate, getTodayInTaiwan } from "@/lib/date";

type TeacherLesson = Lesson & {
  lessonNote?: string | null;
  studentNote?: string | null;
};

type Props = {
  lessons: TeacherLesson[];
  selectedDate: string;
  weekLessonCount: number;
};

export default function TeacherTodayView({
  lessons: initialLessons,
  selectedDate,
  weekLessonCount,
}: Props) {
  const [lessons, setLessons] = useState<TeacherLesson[]>(initialLessons);

  const [completingLesson, setCompletingLesson] =
    useState<TeacherLesson | null>(null);

  const [reschedulingLesson, setReschedulingLesson] =
    useState<TeacherLesson | null>(null);

  const [cancellingLesson, setCancellingLesson] =
    useState<TeacherLesson | null>(null);

  useEffect(() => {
    setLessons(initialLessons);
  }, [initialLessons]);

  const today = getTodayInTaiwan();

  const weekdayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

  const selectedWeekday = weekdayNames[parseLocalDate(selectedDate).getDay()];

  const previousDate = addDays(selectedDate, -1);
  const nextDate = addDays(selectedDate, 1);

  const completedCount = lessons.filter(
    (lesson) => lesson.status === "completed",
  ).length;

  const activeLessonCount = lessons.filter(
    (lesson) => lesson.status !== "cancelled",
  ).length;

  function handleCompleted(
    lessonId: number,
    lessonNote: string,
    studentNote: string,
  ) {
    setLessons((current) =>
      current.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              status: "completed",
              lessonNote,
              studentNote,
            }
          : lesson,
      ),
    );
  }

  async function rescheduleLesson(
    id: number,
    newDate: string,
    newTime: string,
  ) {
    const supabase = createClient();

    const { error } = await supabase
      .from("lessons")
      .update({
        lesson_date: newDate,
        lesson_time: newTime,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("改期失敗");
      return;
    }

    if (newDate === selectedDate) {
      setLessons((current) =>
        current.map((lesson) =>
          lesson.id === id
            ? {
                ...lesson,
                date: newDate,
                time: newTime,
              }
            : lesson,
        ),
      );
    } else {
      setLessons((current) => current.filter((lesson) => lesson.id !== id));
    }
  }

  async function cancelLesson(id: number) {
    const supabase = createClient();

    const { error } = await supabase
      .from("lessons")
      .update({
        status: "cancelled",
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("取消課程失敗");
      return;
    }

    setLessons((current) =>
      current.map((lesson) =>
        lesson.id === id
          ? {
              ...lesson,
              status: "cancelled",
            }
          : lesson,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted">
              {selectedDate} · {selectedWeekday}
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              {selectedDate === today ? "我的今日課程" : "我的課程"}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/teacher?date=${previousDate}`}
              className="rounded-xl bg-fill px-3 py-2 text-sm text-foreground hover:bg-fill-strong"
            >
              ← 前一天
            </Link>

            {selectedDate !== today && (
              <Link
                href="/teacher"
                className="rounded-xl bg-fill px-3 py-2 text-sm text-foreground hover:bg-fill-strong"
              >
                今天
              </Link>
            )}

            <Link
              href={`/teacher?date=${nextDate}`}
              className="rounded-xl bg-fill px-3 py-2 text-sm text-foreground hover:bg-fill-strong"
            >
              後一天 →
            </Link>
          </div>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <TeacherStatCard
            title={selectedDate === today ? "今日課程" : "這天課程"}
            value={activeLessonCount}
          />

          <TeacherStatCard title="已完成" value={completedCount} />

          <TeacherStatCard title="本週課程" value={weekLessonCount} />
        </section>

        {lessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
            這天沒有安排課程
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className={
                  lesson.status === "cancelled"
                    ? "rounded-2xl border border-line bg-fill/50 p-5 opacity-60"
                    : "rounded-2xl border border-line bg-surface p-5"
                }
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xl font-semibold">{lesson.time}</div>

                    <div className="mt-3 font-medium">{lesson.student}</div>

                    <div className="mt-1 text-sm text-muted">
                      {lesson.course}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {lesson.status === "scheduled" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setCompletingLesson(lesson)}
                          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
                        >
                          完成簽到
                        </button>

                        <button
                          type="button"
                          onClick={() => setReschedulingLesson(lesson)}
                          className="rounded-xl bg-fill px-4 py-2 text-sm text-foreground hover:bg-fill-strong"
                        >
                          改期
                        </button>

                        <button
                          type="button"
                          onClick={() => setCancellingLesson(lesson)}
                          className="rounded-xl bg-danger-soft px-4 py-2 text-sm text-danger hover:opacity-80"
                        >
                          取消
                        </button>
                      </>
                    )}

                    {lesson.status === "completed" && (
                      <span className="rounded-full bg-success-soft px-3 py-1.5 text-sm text-success">
                        ✓ 已完成
                      </span>
                    )}

                    {lesson.status === "cancelled" && (
                      <span className="rounded-full bg-fill px-3 py-1.5 text-sm text-muted">
                        已取消
                      </span>
                    )}
                  </div>
                </div>

                {lesson.lessonNote && (
                  <div className="mt-4 rounded-xl bg-background px-4 py-3">
                    <p className="text-xs font-medium text-subtle">
                      教學紀錄（內部）
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                      {lesson.lessonNote}
                    </p>
                  </div>
                )}

                {lesson.studentNote && (
                  <div className="mt-3 rounded-xl bg-background px-4 py-3">
                    <p className="text-xs font-medium text-subtle">
                      給學生的紀錄
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                      {lesson.studentNote}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {completingLesson && (
        <CompleteLessonModal
          lesson={completingLesson}
          onClose={() => setCompletingLesson(null)}
          onCompleted={handleCompleted}
        />
      )}

      {reschedulingLesson && (
        <RescheduleModal
          lesson={reschedulingLesson}
          onSave={rescheduleLesson}
          onClose={() => setReschedulingLesson(null)}
        />
      )}

      {cancellingLesson && (
        <CancelLessonModal
          lesson={cancellingLesson}
          onConfirm={cancelLesson}
          onClose={() => setCancellingLesson(null)}
        />
      )}
    </main>
  );
}

function TeacherStatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-muted">{title}</p>

      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
