"use client";

import { useState } from "react";
import type { Lesson } from "@/types/lesson";
import Dialog, {
  DialogActions,
  dialogButtonClassName,
} from "@/components/ui/Dialog";

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
    <Dialog
      onClose={onClose}
      eyebrow={`${lesson.date.replaceAll("-", ".")}・${lesson.time}`}
      title="取消這堂課？"
      description={`${lesson.student}・${lesson.course}`}
    >
      <div className="rounded-2xl bg-danger-soft px-4 py-3 text-sm leading-6 text-danger">
        這堂課會保留在紀錄中，狀態改成「已取消」，不會扣學生的堂數。
      </div>

      <DialogActions>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className={dialogButtonClassName.secondary}
        >
          返回
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={saving}
          className={dialogButtonClassName.danger}
        >
          {saving ? "取消中..." : "確定取消"}
        </button>
      </DialogActions>
    </Dialog>
  );
}
