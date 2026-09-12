"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AddLessonForm from "@/components/AddLessonForm";
import type { Lesson } from "@/types/lesson";
import { supabase } from "@/lib/supabase";

import {
  addDays,
  formatLocalDate,
} from "@/lib/date";

type Props = {
  initialLessons: Lesson[];
  selectedDate: string;
};

export default function Dashboard({ initialLessons, selectedDate }: Props) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [showForm, setShowForm] = useState(false);
  useEffect(() => {
    setLessons(initialLessons);
  }, [initialLessons]);
  const previousDate = addDays(selectedDate, -1);
  const nextDate = addDays(selectedDate, 1);
  const today = formatLocalDate(new Date());

  async function addLesson(lesson: Lesson) {
    const { data, error } = await supabase
      .from("lessons")
      .insert({
        student: lesson.student,
        teacher: lesson.teacher,
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

  const completedLessons = lessons.filter(
    (lesson) => lesson.status === "completed",
  );

  const cancelledLessons = lessons.filter(
    (lesson) => lesson.status === "cancelled",
  );

  const totalRevenue = completedLessons.reduce(
    (sum, lesson) => sum + lesson.price,
    0,
  );

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

  async function rescheduleLesson(id: number, newTime: string) {
    const { error } = await supabase
      .from("lessons")
      .update({ lesson_time: newTime })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("改期失敗");
      return;
    }

    setLessons((currentLessons) =>
      currentLessons.map((lesson) =>
        lesson.id === id ? { ...lesson, time: newTime } : lesson,
      ),
    );
  }

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-10">
          <p className="mb-2 text-sm text-zinc-400">Studio Management</p>

          <h1 className="text-4xl font-bold tracking-tight">Argo</h1>

          <p className="mt-3 text-zinc-400">吉他工作室簽到與月結系統</p>
        </header>

        <section className="mb-10 grid gap-4 md:grid-cols-4">
          <StatCard
            title="排定課程"
            value={lessons
              .filter((lesson) => lesson.status !== "cancelled")
              .length.toString()}
          />

          <StatCard title="已完成" value={completedLessons.length.toString()} />

          <StatCard title="已取消" value={cancelledLessons.length.toString()} />

          <StatCard
            title="今日營收"
            value={`$${totalRevenue.toLocaleString()}`}
          />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">課程</h2>

              <p className="mt-1 text-sm text-zinc-500">
                {selectedDate.replaceAll("-", " / ")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/?date=${previousDate}`}
                className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                ← 前一天
              </Link>

              {selectedDate !== today && (
                <Link
                  href="/"
                  className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                >
                  今天
                </Link>
              )}

              <Link
                href={`/?date=${nextDate}`}
                className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                後一天 →
              </Link>

              <button
                onClick={() => setShowForm(true)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
              >
                ＋ 新增課程
              </button>
            </div>
          </div>

          {showForm && (
            <AddLessonForm
              onAddLesson={addLesson}
              onCancel={() => setShowForm(false)}
            />
          )}

          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center justify-between border-b border-zinc-800 p-5 last:border-b-0"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 text-lg font-semibold">
                    {lesson.time}
                  </div>

                  <div>
                    <div className="font-medium">{lesson.student}</div>

                    <div className="mt-1 text-sm text-zinc-500">
                      {lesson.course} · {lesson.teacher}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="mr-2 text-sm text-zinc-400">
                    ${lesson.price}
                  </div>

                  {lesson.status === "scheduled" && (
                    <>
                      <button
                        onClick={() => completeLesson(lesson.id)}
                        className="rounded-full bg-emerald-950 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-900"
                      >
                        完成
                      </button>

                      <button
                        onClick={() => {
                          const newTime = window.prompt(
                            "輸入新的上課時間，例如 19:30",
                            lesson.time,
                          );

                          if (newTime) {
                            rescheduleLesson(lesson.id, newTime);
                          }
                        }}
                        className="rounded-full bg-blue-950 px-4 py-2 text-sm text-blue-400 hover:bg-blue-900"
                      >
                        改期
                      </button>

                      <button
                        onClick={() => cancelLesson(lesson.id)}
                        className="rounded-full bg-red-950 px-4 py-2 text-sm text-red-400 hover:bg-red-900"
                      >
                        取消
                      </button>
                    </>
                  )}

                  {lesson.status === "completed" && (
                    <span className="rounded-full bg-emerald-950 px-4 py-2 text-sm text-emerald-400">
                      ✓ 已完成
                    </span>
                  )}

                  {lesson.status === "cancelled" && (
                    <span className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-500">
                      已取消
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
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
