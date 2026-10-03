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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            課程改期
          </h2>

          <p className="mt-1 text-sm text-muted">
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
              className="mb-2 block text-sm text-muted"
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
              className="w-full rounded-xl border border-line-strong bg-background px-4 py-3 text-foreground outline-none focus:border-foreground/40"
            />
          </div>

          <div>
            <label
              htmlFor="reschedule-time"
              className="mb-2 block text-sm text-muted"
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
              className="w-full rounded-xl border border-line-strong bg-background px-4 py-3 text-foreground outline-none focus:border-foreground/40"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-fill-strong hover:text-foreground"
            >
              取消
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "儲存中..." : "儲存改期"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}