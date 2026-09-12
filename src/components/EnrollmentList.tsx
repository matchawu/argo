"use client";

import { useState } from "react";
import AddEnrollmentForm from "@/components/AddEnrollmentForm";
import { generateLessonsForEnrollment } from "@/lib/generateLessons";
import type { Enrollment } from "@/types/enrollment";
import { createClient } from "@/lib/supabase/client";
import { formatLocalDate } from "@/lib/date";
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
      await generateLessonsForEnrollment(enrollment, 4);

      alert("未來 4 週課程已建立");
    } catch (error) {
      console.error(error);
      alert("生成課程失敗");
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
      time: string;
      updateFutureLessons: boolean;
    },
  ) {
    const selectedTeacher = teachers.find(
      (teacher) => teacher.id === values.teacherId,
    );

    if (!selectedTeacher) {
      alert("找不到老師資料");
      return;
    }

    const { error } = await supabase
      .from("enrollments")
      .update({
        teacher_id: values.teacherId,
        course: values.course,
        price: values.price,
        default_weekday: values.weekday,
        default_time: values.time,
      })
      .eq("id", enrollment.id);

    if (error) {
      console.error(error);
      alert("更新固定課程失敗");
      return;
    }

    if (values.updateFutureLessons) {
      const today = formatLocalDate(new Date());

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
        alert("固定課程已更新，但未來課程同步失敗");
        return;
      }
    }

    setEditingId(null);
    window.location.reload();
  }

  async function deactivateEnrollment(enrollment: Enrollment) {
    const confirmed = window.confirm(
      `確定要停用 ${enrollment.students.name} 的 ${enrollment.course} 嗎？`,
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("enrollments")
      .update({
        active: false,
      })
      .eq("id", enrollment.id);

    if (error) {
      console.error(error);
      alert("停用固定課程失敗");
      return;
    }

    const cancelFutureLessons =
      window.confirm("是否一起取消未來尚未完成的課程？");

    if (cancelFutureLessons) {
      const today = formatLocalDate(new Date());

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
        alert("固定課程已停用，但未來課程取消失敗");
        return;
      }
    }

    window.location.reload();
  }

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">固定課程</h1>

          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
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
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">
                    {enrollment.students.name}
                  </div>

                  <div className="mt-1 text-sm text-zinc-400">
                    {enrollment.course}
                    {" · "}
                    {enrollment.teachers.name}
                  </div>

                  <div className="mt-2 text-sm text-zinc-500">
                    每週
                    {weekdayLabels[enrollment.default_weekday]}{" "}
                    {enrollment.default_time.slice(0, 5)}
                    {" · "}${enrollment.price}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerate(enrollment)}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
                  >
                    生成未來 4 週
                  </button>

                  <button
                    onClick={() =>
                      setEditingId(
                        editingId === enrollment.id ? null : enrollment.id,
                      )
                    }
                    className="rounded-xl bg-blue-950 px-4 py-2 text-sm text-blue-400 hover:bg-blue-900"
                  >
                    {editingId === enrollment.id ? "收起" : "編輯"}
                  </button>

                  <button
                    onClick={() => deactivateEnrollment(enrollment)}
                    className="rounded-xl bg-red-950 px-4 py-2 text-sm text-red-400 hover:bg-red-900"
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
