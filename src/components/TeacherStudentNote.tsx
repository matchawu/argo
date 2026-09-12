"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  teacherId: number;
  studentId: number;
  initialNote: string;
};

export default function TeacherStudentNote({
  teacherId,
  studentId,
  initialNote,
}: Props) {
  const [note, setNote] = useState(initialNote);
  const [savedNote, setSavedNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges = note !== savedNote;

  async function saveNote() {
    const supabase = createClient();

    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from("teacher_student_notes")
      .upsert(
        {
          teacher_id: teacherId,
          student_id: studentId,
          note,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "teacher_id,student_id",
        },
      );

    setSaving(false);

    if (error) {
      console.error(error);
      alert("儲存教學備註失敗");
      return;
    }

    setSavedNote(note);
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            教學備註
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            只有你與管理員能看到這份備註
          </p>
        </div>

        {saved && (
          <span className="text-sm text-emerald-400">
            ✓ 已儲存
          </span>
        )}
      </div>

      <textarea
        value={note}
        onChange={(event) => {
          setNote(event.target.value);
          setSaved(false);
        }}
        rows={6}
        placeholder="例如：最近在練 Alternate Picking，下一堂複習 Back in Black riff..."
        className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
      />

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-zinc-600">
          {note.length} 字
        </p>

        <button
          type="button"
          onClick={saveNote}
          disabled={saving || !hasChanges}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "儲存中..." : "儲存備註"}
        </button>
      </div>
    </section>
  );
}