"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Lesson = {
  id: number;
  student: string;
  course: string;
  date: string;
  time: string;
  lessonNote?: string | null;
};

type Props = {
  lesson: Lesson;
  onClose: () => void;
  onCompleted: (
    lessonId: number,
    lessonNote: string,
  ) => void;
};

export default function CompleteLessonModal({
  lesson,
  onClose,
  onCompleted,
}: Props) {
  const [note, setNote] = useState(
    lesson.lessonNote ?? "",
  );

  const [saving, setSaving] = useState(false);

  async function handleComplete() {
    const supabase = createClient();

    setSaving(true);

    const { error } = await supabase
      .from("lessons")
      .update({
        status: "completed",
        lesson_note: note,
      })
      .eq("id", lesson.id);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("完成簽到失敗");
      return;
    }

    onCompleted(lesson.id, note);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="mb-5">
          <p className="text-sm text-zinc-500">
            {lesson.date} · {lesson.time}
          </p>

          <h2 className="mt-1 text-xl font-semibold">
            完成簽到
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            {lesson.student} · {lesson.course}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            本堂教學紀錄
          </label>

          <textarea
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
            rows={7}
            placeholder="例如：今天練 Back in Black 主歌 riff，節拍比上週穩定；下次繼續練推弦..."
            className="w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm leading-6 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-500"
          />

          <p className="mt-2 text-xs text-zinc-600">
            教學紀錄可以留空，之後也能在學生頁補寫。
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
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
              返回
            </button>

            <button
              type="button"
              onClick={handleComplete}
              disabled={saving}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "儲存中..."
                : "完成簽到"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}