"use client";

import { useState } from "react";
import type { Lesson } from "@/types/lesson";

type Props = {
  lesson: Lesson;
  onConfirm: (id: number) => Promise<void>;
  onClose: () => void;
};

export default function CancelLessonModal({
  lesson,
  onConfirm,
  onClose,
}: Props) {
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);

    await onConfirm(lesson.id);

    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            確定取消這堂課？
          </h2>

          <p className="mt-2 text-sm text-muted">
            {lesson.student} · {lesson.course}
          </p>

          <p className="mt-1 text-sm text-muted">
            {lesson.date} {lesson.time}
          </p>
        </div>

        <div className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
          取消後這堂課會保留在紀錄中，但狀態會改成「已取消」。
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-fill-strong hover:text-foreground"
          >
            返回
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="rounded-xl bg-danger px-4 py-2 text-sm font-medium text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "取消中..." : "確定取消"}
          </button>
        </div>
      </div>
    </div>
  );
}