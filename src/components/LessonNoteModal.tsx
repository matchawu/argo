"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  lessonId: number;
  studentName: string;
  course: string;
  initialNote: string;
  initialStudentNote: string;
  onClose: () => void;
  onSaved: (note: string, studentNote: string) => void;
};

export default function LessonNoteModal({
  lessonId,
  studentName,
  course,
  initialNote,
  initialStudentNote,
  onClose,
  onSaved,
}: Props) {
  const [note, setNote] = useState(initialNote);
  const [studentNote, setStudentNote] = useState(
    initialStudentNote,
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const supabase = createClient();

    setSaving(true);

    const { error } = await supabase
      .from("lessons")
      .update({
        lesson_note: note,
        student_note: studentNote,
      })
      .eq("id", lessonId);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("儲存教學紀錄失敗");
      return;
    }

    onSaved(note, studentNote);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-2xl">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">
            教學紀錄
          </h2>

          <p className="mt-1 text-sm text-muted">
            {studentName} · {course}
          </p>
        </div>

        <label className="mb-2 block text-sm text-muted">
          教學紀錄（內部，學生看不到）
        </label>

        <textarea
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
          rows={6}
          placeholder="例如：今天練主歌 riff，節拍還會飄；下次繼續練 palm mute..."
          className="w-full resize-y rounded-xl border border-line-strong bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-subtle focus:border-foreground/40"
        />

        <label className="mb-2 mt-4 block text-sm text-muted">
          給學生的紀錄（學生登入後看得到）
        </label>

        <textarea
          value={studentNote}
          onChange={(event) =>
            setStudentNote(event.target.value)
          }
          rows={4}
          placeholder="例如：今天進度很好！回家請練習主歌 riff，每天 15 分鐘。"
          className="w-full resize-y rounded-xl border border-line-strong bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-subtle focus:border-foreground/40"
        />

        <div className="mt-5 flex items-center justify-end gap-4">

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm text-muted hover:bg-fill-strong hover:text-foreground"
            >
              取消
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "儲存中..." : "儲存紀錄"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}