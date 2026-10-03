"use client";

import { toast } from "sonner";
import Dialog, {
  DialogActions,
  dialogButtonClassName,
  textareaClassName,
} from "@/components/ui/Dialog";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Lesson = {
  id: number;
  student: string;
  course: string;
  date: string;
  time: string;
  lessonNote?: string | null;
  studentNote?: string | null;
};

type Props = {
  lesson: Lesson;
  onClose: () => void;
  onCompleted: (
    lessonId: number,
    lessonNote: string,
    studentNote: string,
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

  const [studentNote, setStudentNote] = useState(
    lesson.studentNote ?? "",
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
        student_note: studentNote,
      })
      .eq("id", lesson.id);

    setSaving(false);

    if (error) {
      console.error(error);
      toast.error("完成簽到失敗");
      return;
    }

    toast.success("已完成簽到");

    onCompleted(lesson.id, note, studentNote);
    onClose();
  }

  return (
    <Dialog
      onClose={onClose}
      size="lg"
      eyebrow={`${lesson.date.replaceAll("-", ".")}・${lesson.time}`}
      title="完成簽到"
      description={`${lesson.student}・${lesson.course}`}
    >
      <label className="mb-2 block text-sm text-muted">
        本堂教學紀錄（內部，學生看不到）
      </label>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={6}
        placeholder="例如：今天練 Back in Black 主歌 riff，節拍比上週穩定；下次繼續練推弦..."
        className={textareaClassName}
      />

      <label className="mb-2 mt-4 block text-sm text-muted">
        給學生的紀錄（學生登入後看得到）
      </label>

      <textarea
        value={studentNote}
        onChange={(event) => setStudentNote(event.target.value)}
        rows={4}
        placeholder="例如：今天進度很好！回家請練習主歌 riff，每天 15 分鐘。"
        className={textareaClassName}
      />

      <p className="mt-2 text-xs text-subtle">
        兩個紀錄都可以留空，之後也能在學生頁補寫。
      </p>

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
          onClick={handleComplete}
          disabled={saving}
          className={dialogButtonClassName.primary}
        >
          {saving ? "儲存中..." : "完成簽到"}
        </button>
      </DialogActions>
    </Dialog>
  );
}
