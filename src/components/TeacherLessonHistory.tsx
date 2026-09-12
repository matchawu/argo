"use client";

import { useState } from "react";
import LessonNoteModal from "@/components/LessonNoteModal";

type LessonHistoryItem = {
  id: number;
  course: string;
  lesson_date: string;
  lesson_time: string;
  price: number;
  status: "scheduled" | "completed" | "cancelled";
  lesson_note: string | null;
};

type Props = {
  studentName: string;
  initialLessons: LessonHistoryItem[];
};

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

export default function TeacherLessonHistory({
  studentName,
  initialLessons,
}: Props) {
  const [lessons, setLessons] =
    useState(initialLessons);

  const [editingLesson, setEditingLesson] =
    useState<LessonHistoryItem | null>(null);

  function updateLessonNote(
    lessonId: number,
    note: string,
  ) {
    setLessons((current) =>
      current.map((lesson) =>
        lesson.id === lessonId
          ? {
              ...lesson,
              lesson_note: note,
            }
          : lesson,
      ),
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className={
              lesson.status === "cancelled"
                ? "border-b border-zinc-800 bg-zinc-950/40 p-5 opacity-60 last:border-b-0"
                : "border-b border-zinc-800 p-5 last:border-b-0"
            }
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    {lesson.lesson_date}
                  </span>

                  <span className="text-sm text-zinc-400">
                    {lesson.lesson_time.slice(0, 5)}
                  </span>
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  {lesson.course}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    statusClassName[lesson.status]
                  }`}
                >
                  {statusLabel[lesson.status]}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setEditingLesson(lesson)
                  }
                  className="rounded-xl bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white"
                >
                  {lesson.lesson_note
                    ? "編輯教學紀錄"
                    : "新增教學紀錄"}
                </button>
              </div>
            </div>

            {lesson.lesson_note && (
              <div className="mt-4 rounded-xl bg-zinc-950 px-4 py-3">
                <p className="text-xs font-medium text-zinc-600">
                  教學紀錄
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                  {lesson.lesson_note}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {editingLesson && (
        <LessonNoteModal
          lessonId={editingLesson.id}
          studentName={studentName}
          course={editingLesson.course}
          initialNote={
            editingLesson.lesson_note ?? ""
          }
          onClose={() =>
            setEditingLesson(null)
          }
          onSaved={(note) =>
            updateLessonNote(
              editingLesson.id,
              note,
            )
          }
        />
      )}
    </>
  );
}