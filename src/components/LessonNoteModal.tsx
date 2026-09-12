"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  lessonId: number;
  studentName: string;
  course: string;
  initialNote: string;
  onClose: () => void;
  onSaved: (note: string) => void;
};

export default function LessonNoteModal({
  lessonId,
  studentName,
  course,
  initialNote,
  onClose,
  onSaved,
}: Props) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const supabase = createClient();

    setSaving(true);

    const { error } = await supabase
      .from("lessons")
      .update({
        lesson_note: note,
      })
      .eq("id", lessonId);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("儲存教學紀錄失敗");
      return;
    }

    onSaved(note);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-5">
          <h2 className="text-xl font-semibold">
            教學紀錄
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            {studentName} · {course}
          </p>
        </div>

        <textarea
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
          rows={8}
          placeholder="例如：今天練主歌 riff，節拍還會飄；下次繼續練 palm mute..."
          className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
        />

        <div className="mt-5 flex items-center justify-between gap-4">
          <span className="text-xs text-zinc-600">
            {note.length} 字
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              取消
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "儲存中..." : "儲存紀錄"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}