"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AddLessonForm from "@/components/AddLessonForm";
import type { Lesson } from "@/types/lesson";
import { createClient } from "@/lib/supabase/client";
import { addDays, formatLocalDate } from "@/lib/date";
import { lessonStatusClassName, lessonStatusLabel } from "@/lib/lessonStatus";
import RescheduleModal from "@/components/RescheduleModal";
import CancelLessonModal from "@/components/CancelLessonModal";

type Props = {
  initialLessons: Lesson[];
  selectedDate: string;
};

export default function Dashboard({ initialLessons, selectedDate }: Props) {
  const supabase = createClient();

  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);

  const [showForm, setShowForm] = useState(false);

  const [reschedulingLesson, setReschedulingLesson] = useState<Lesson | null>(
    null,
  );

  const [cancellingLesson, setCancellingLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    setLessons(initialLessons);
  }, [initialLessons]);

  const previousDate = addDays(selectedDate, -1);
  const nextDate = addDays(selectedDate, 1);
  const today = formatLocalDate(new Date());

  const completedLessons = lessons.filter(
    (lesson) => lesson.status === "completed",
  );

  const cancelledLessons = lessons.filter(
    (lesson) => lesson.status === "cancelled",
  );

  const scheduledLessons = lessons.filter(
    (lesson) => lesson.status === "scheduled",
  );

  const totalRevenue = completedLessons.reduce(
    (sum, lesson) => sum + lesson.price,
    0,
  );

  async function addLesson(lesson: Lesson) {
    const { data, error } = await supabase
      .from("lessons")
      .insert({
        student_id: lesson.studentId,
        teacher_id: lesson.teacherId,

        student: lesson.student,
        teacher: lesson.teacher,

        teacher_share: lesson.teacherShare,

        course: lesson.course,
        lesson_date: lesson.date,
        lesson_time: lesson.time,
        price: lesson.price,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("新增課程失敗");
      return;
    }

    const newLesson: Lesson = {
      id: data.id,

      studentId: data.student_id,
      teacherId: data.teacher_id,
      teacherShare: data.teacher_share,

      student: data.student,
      teacher: data.teacher,

      course: data.course,
      date: data.lesson_date,
      time: data.lesson_time.slice(0, 5),
      price: data.price,
      status: data.status,
    };

    setLessons((currentLessons) => [...currentLessons, newLesson]);

    setShowForm(false);
  }

  async function completeLesson(id: number) {
    const { error } = await supabase
      .from("lessons")
      .update({ status: "completed" })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("更新失敗");
      return;
    }

    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === id ? { ...lesson, status: "completed" } : lesson,
      ),
    );
  }

  async function cancelLesson(id: number) {
    const { error } = await supabase
      .from("lessons")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("取消課程失敗");
      return;
    }

    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === id ? { ...lesson, status: "cancelled" } : lesson,
      ),
    );
  }

  async function restoreLesson(id: number) {
    const { error } = await supabase
      .from("lessons")
      .update({ status: "scheduled" })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("復原失敗");
      return;
    }

    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === id ? { ...lesson, status: "scheduled" } : lesson,
      ),
    );
  }

  async function restoreCancelledLesson(id: number) {
    const { error } = await supabase
      .from("lessons")
      .update({ status: "scheduled" })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("恢復課程失敗");
      return;
    }

    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === id ? { ...lesson, status: "scheduled" } : lesson,
      ),
    );
  }

  async function rescheduleLesson(
    id: number,
    newDate: string,
    newTime: string,
  ) {
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
      setLessons((currentLessons) =>
        currentLessons.map((lesson) =>
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
      setLessons((currentLessons) =>
        currentLessons.filter((lesson) => lesson.id !== id),
      );
    }
  }

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <header className="mb-10">
          <p className="mb-2 text-sm text-zinc-500">Studio Management System</p>

          <h1 className="text-4xl font-bold tracking-tight">Argo</h1>

          <p className="mt-3 text-zinc-400">吉他工作室簽到與月結系統</p>
        </header>

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="待上課" value={scheduledLessons.length.toString()} />

          <StatCard title="已完成" value={completedLessons.length.toString()} />

          <StatCard title="已取消" value={cancelledLessons.length.toString()} />

          <StatCard
            title="當日營收"
            value={`$${totalRevenue.toLocaleString()}`}
          />
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-semibold">課程</h2>

                {selectedDate === today && (
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-black">
                    今天
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-zinc-500">
                {selectedDate.replaceAll("-", " / ")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/?date=${previousDate}`}
                className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700"
              >
                ← 前一天
              </Link>

              {selectedDate !== today && (
                <Link
                  href="/"
                  className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700"
                >
                  今天
                </Link>
              )}

              <Link
                href={`/?date=${nextDate}`}
                className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700"
              >
                後一天 →
              </Link>

              <button
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                ＋ 新增課程
              </button>
            </div>
          </div>

          {showForm && (
            <AddLessonForm
              onAddLesson={addLesson}
              onCancel={() => setShowForm(false)}
              initialDate={selectedDate}
            />
          )}

          {lessons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 px-6 py-12 text-center">
              <p className="text-sm text-zinc-500">這天還沒有安排課程</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-800">
              {lessons.map((lesson) => {
                const isCancelled = lesson.status === "cancelled";

                return (
                  <div
                    key={lesson.id}
                    className={
                      isCancelled
                        ? "flex flex-col gap-4 border-b border-zinc-800 bg-zinc-950/40 p-5 opacity-60 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                        : "flex flex-col gap-4 border-b border-zinc-800 p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
                    }
                  >
                    <div className="flex min-w-0 items-center gap-5">
                      <div
                        className={
                          isCancelled
                            ? "w-14 shrink-0 text-lg font-semibold text-zinc-600 line-through"
                            : "w-14 shrink-0 text-lg font-semibold"
                        }
                      >
                        {lesson.time}
                      </div>

                      <div className="min-w-0">
                        <div
                          className={
                            isCancelled
                              ? "truncate font-medium text-zinc-500 line-through"
                              : "truncate font-medium"
                          }
                        >
                          {lesson.student}
                        </div>

                        <div className="mt-1 truncate text-sm text-zinc-500">
                          {lesson.course} · {lesson.teacher}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <div className="mr-1 text-sm text-zinc-400">
                        ${lesson.price.toLocaleString()}
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          lessonStatusClassName[lesson.status]
                        }`}
                      >
                        {lessonStatusLabel[lesson.status]}
                      </span>

                      {lesson.status === "scheduled" && (
                        <>
                          <button
                            onClick={() => completeLesson(lesson.id)}
                            className="rounded-full bg-emerald-950 px-4 py-2 text-sm text-emerald-400 transition hover:bg-emerald-900"
                          >
                            完成
                          </button>

                          <button
                            onClick={() => setReschedulingLesson(lesson)}
                            className="rounded-full bg-blue-950 px-4 py-2 text-sm text-blue-400 transition hover:bg-blue-900"
                          >
                            改期
                          </button>

                          <button
                            onClick={() => setCancellingLesson(lesson)}
                            className="rounded-full bg-red-950 px-4 py-2 text-sm text-red-400 transition hover:bg-red-900"
                          >
                            取消
                          </button>
                        </>
                      )}

                      {lesson.status === "completed" && (
                        <button
                          onClick={() => restoreLesson(lesson.id)}
                          className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                        >
                          復原
                        </button>
                      )}

                      {lesson.status === "cancelled" && (
                        <button
                          onClick={() => restoreCancelledLesson(lesson.id)}
                          className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
                        >
                          恢復課程
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
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

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-500">{title}</p>

      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
