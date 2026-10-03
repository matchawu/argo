"use client";

import { useState } from "react";
import type { Lesson } from "@/types/lesson";
import Dialog, {
  DialogActions,
  dialogButtonClassName,
  inputClassName,
} from "@/components/ui/Dialog";

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
    <Dialog
      onClose={onClose}
      title="課程改期"
      description={`${lesson.student}・${lesson.course}`}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
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
              onChange={(event) => setDate(event.target.value)}
              className={inputClassName}
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
              onChange={(event) => setTime(event.target.value)}
              className={inputClassName}
            />
          </div>
        </div>

        <DialogActions>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={dialogButtonClassName.secondary}
          >
            取消
          </button>

          <button
            type="submit"
            disabled={saving}
            className={dialogButtonClassName.primary}
          >
            {saving ? "儲存中..." : "儲存改期"}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
