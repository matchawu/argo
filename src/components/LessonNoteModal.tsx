"use client";

import { toast } from "sonner";
import Dialog, {
  DialogActions,
  dialogButtonClassName,
  textareaClassName,
} from "@/components/ui/Dialog";
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
      toast.error("儲存教學紀錄失敗");
      return;
    }

    toast.success("已儲存教學紀錄");

    onSaved(note, studentNote);
    onClose();
  }

  return (
    <Dialog
      onClose={onClose}
      size="lg"
      title="教學紀錄"
      description={`${studentName}・${course}`}
    >
      <label className="mb-2 block text-sm text-muted">
        教學紀錄（內部，學生看不到）
      </label>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={6}
        placeholder="例如：今天練主歌 riff，節拍還會飄；下次繼續練 palm mute..."
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
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={dialogButtonClassName.primary}
        >
          {saving ? "儲存中..." : "儲存紀錄"}
        </button>
      </DialogActions>
    </Dialog>
  );
}
