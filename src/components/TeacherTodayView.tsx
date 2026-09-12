"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type TeacherLesson = {
  id: number;
  student: string;
  course: string;
  date: string;
  time: string;
  price: number;
  status: "scheduled" | "completed" | "cancelled";
};

type Props = {
  lessons: TeacherLesson[];
  today: string;
};

export default function TeacherTodayView({
  lessons: initialLessons,
  today,
}: Props) {
  const [lessons, setLessons] =
    useState<TeacherLesson[]>(initialLessons);

  async function completeLesson(id: number) {
    const supabase = createClient();

    const { error } = await supabase
      .from("lessons")
      .update({
        status: "completed",
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("簽到失敗");
      return;
    }

    setLessons((current) =>
      current.map((lesson) =>
        lesson.id === id
          ? {
              ...lesson,
              status: "completed",
            }
          : lesson,
      ),
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm text-zinc-500">
            {today}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            我的今日課程
          </h1>
        </div>

        {lessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
            今天沒有安排課程
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-semibold">
                      {lesson.time}
                    </div>

                    <div className="mt-3 font-medium">
                      {lesson.student}
                    </div>

                    <div className="mt-1 text-sm text-zinc-500">
                      {lesson.course}
                    </div>
                  </div>

                  <div>
                    {lesson.status === "scheduled" && (
                      <button
                        onClick={() =>
                          completeLesson(lesson.id)
                        }
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
                      >
                        完成簽到
                      </button>
                    )}

                    {lesson.status === "completed" && (
                      <span className="rounded-full bg-emerald-950 px-3 py-1.5 text-sm text-emerald-400">
                        ✓ 已完成
                      </span>
                    )}

                    {lesson.status === "cancelled" && (
                      <span className="rounded-full bg-zinc-800 px-3 py-1.5 text-sm text-zinc-500">
                        已取消
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}