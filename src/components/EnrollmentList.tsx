"use client";

import { toast } from "sonner";
import { confirmDialog } from "@/components/ui/ConfirmDialog";
import { useState } from "react";
import AddEnrollmentForm from "@/components/AddEnrollmentForm";
import { generateLessonsForEnrollment } from "@/lib/generateLessons";
import type { Enrollment } from "@/types/enrollment";
import { createClient } from "@/lib/supabase/client";
import { formatLocalDate, getTodayInTaiwan } from "@/lib/date";
import EditEnrollmentForm from "@/components/EditEnrollmentForm";

type Student = {
  id: number;
  name: string;
};

type Teacher = {
  id: number;
  name: string;
  teacher_share: number;
};

type Props = {
  enrollments: Enrollment[];
  students: Student[];
  teachers: Teacher[];
};

const weekdayLabels = ["日", "一", "二", "三", "四", "五", "六"];

export default function EnrollmentList({
  enrollments,
  students,
  teachers,
}: Props) {

  const supabase = createClient();
  
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function handleGenerate(enrollment: Enrollment) {
    try {
      const created = await generateLessonsForEnrollment(enrollment, 4);

      toast.success(
        created.length > 0
          ? `已新增 ${created.length} 堂課`
          : "接下來 4 週的課都已經排好了",
      );
    } catch (error) {
      console.error(error);
      toast.error("生成課程失敗");
    }
  }

  function handleCreated() {
    setShowForm(false);

    window.location.reload();
  }

  async function saveEnrollment(
    enrollment: Enrollment,
    values: {
      teacherId: number;
      course: string;
      price: number;
      weekday: number;
      intervalWeeks: number;
      time: string;
      updateFutureLessons: boolean;
    },
  ) {
    const selectedTeacher = teachers.find(
      (teacher) => teacher.id === values.teacherId,
    );

    if (!selectedTeacher) {
      toast.error("找不到老師資料");
      return;
    }

    const { error } = await supabase
      .from("enrollments")
      .update({
        teacher_id: values.teacherId,
        course: values.course,
        price: values.price,
        default_weekday: values.weekday,
        interval_weeks: values.intervalWeeks,
        default_time: values.time,
      })
      .eq("id", enrollment.id);

    if (error) {
      console.error(error);
      toast.error("更新固定課程失敗");
      return;
    }

    if (values.updateFutureLessons) {
      const today = getTodayInTaiwan();

      const { error: lessonsError } = await supabase
        .from("lessons")
        .update({
          teacher: selectedTeacher.name,
          course: values.course,
          price: values.price,
          lesson_time: values.time,
          teacher_share: selectedTeacher.teacher_share,
        })
        .eq("enrollment_id", enrollment.id)
        .eq("status", "scheduled")
        .gte("lesson_date", today);

      if (lessonsError) {
        console.error(lessonsError);
        toast.error("固定課程已更新，但未來課程同步失敗");
        return;
      }
    }

    setEditingId(null);
    window.location.reload();
  }

  async function deactivateEnrollment(enrollment: Enrollment) {
    const confirmed = await confirmDialog({
      title: `停用 ${enrollment.students.name} 的${enrollment.course}？`,
      description: "停用後不會再產生新的課程，已上過的紀錄會保留。",
      confirmText: "停用",
      tone: "danger",
    });

    if (!confirmed) return;

    const { error } = await supabase
      .from("enrollments")
      .update({
        active: false,
      })
      .eq("id", enrollment.id);

    if (error) {
      console.error(error);
      toast.error("停用固定課程失敗");
      return;
    }

    const cancelFutureLessons = await confirmDialog({
      title: "要一起取消未來的課嗎？",
      description: "今天以後、還沒上的課會改成「已取消」。",
      confirmText: "一起取消",
      cancelText: "保留未來的課",
    });

    if (cancelFutureLessons) {
      const today = getTodayInTaiwan();

      const { error: lessonsError } = await supabase
        .from("lessons")
        .update({
          status: "cancelled",
        })
        .eq("enrollment_id", enrollment.id)
        .eq("status", "scheduled")
        .gte("lesson_date", today);

      if (lessonsError) {
        console.error(lessonsError);
        toast.error("固定課程已停用，但未來課程取消失敗");
        return;
      }
    }

    window.location.reload();
  }

  return (
    <main className="min-h-screen text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">固定課程</h1>

          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
          >
            ＋ 新增固定課程
          </button>
        </div>

        {showForm && (
          <AddEnrollmentForm
            students={students}
            teachers={teachers}
            onCreated={handleCreated}
          />
        )}

        <div className="space-y-4">
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="rounded-2xl border border-line bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">
                    {enrollment.students.name}
                  </div>

                  <div className="mt-1 text-sm text-muted">
                    {enrollment.course}
                    {" · "}
                    {enrollment.teachers.name}
                  </div>

                  <div className="mt-2 text-sm text-muted">
                    {enrollment.interval_weeks === 2 ? "隔週" : "每週"}
                    {weekdayLabels[enrollment.default_weekday]}{" "}
                    {enrollment.default_time.slice(0, 5)}
                    {" · "}${enrollment.price}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerate(enrollment)}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
                  >
                    生成未來 4 週
                  </button>

                  <button
                    onClick={() =>
                      setEditingId(
                        editingId === enrollment.id ? null : enrollment.id,
                      )
                    }
                    className="rounded-xl bg-fill px-4 py-2 text-sm text-foreground hover:bg-fill-strong"
                  >
                    {editingId === enrollment.id ? "收起" : "編輯"}
                  </button>

                  <button
                    onClick={() => deactivateEnrollment(enrollment)}
                    className="rounded-xl bg-danger-soft px-4 py-2 text-sm text-danger hover:opacity-80"
                  >
                    停用
                  </button>
                </div>
              </div>

              {editingId === enrollment.id && (
                <EditEnrollmentForm
                  enrollment={enrollment}
                  teachers={teachers}
                  onSave={(values) => saveEnrollment(enrollment, values)}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
