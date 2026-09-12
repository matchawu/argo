"use client";

import { useState } from "react";
import type { Lesson } from "@/types/lesson";

type Props = {
  lesson: Lesson;
  onSave: (
    id: number,
    newDate: string,
    newTime: string,
  ) => Promise<void>;
  onClose: () => void;
};

export default function RescheduleModal({
  lesson,
  onSave,
  onClose,
}: Props) {
  const [date, setDate] = useState(lesson.date);
  const [time, setTime] = useState(lesson.time);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!date || !time) {
      return;
    }

    setSaving(true);

    await onSave(
      lesson.id,
      date,
      time,
    );

    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">
            課程改期
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {lesson.student} · {lesson.course}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="reschedule-date"
              className="mb-2 block text-sm text-zinc-400"
            >
              上課日期
            </label>

            <input
              id="reschedule-date"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label
              htmlFor="reschedule-time"
              className="mb-2 block text-sm text-zinc-400"
            >
              上課時間
            </label>

            <input
              id="reschedule-time"
              type="time"
              value={time}
              onChange={(event) =>
                setTime(event.target.value)
              }
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              取消
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "儲存中..." : "儲存改期"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}