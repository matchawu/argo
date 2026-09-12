"use client";

import { useState } from "react";
import AddEnrollmentForm from "@/components/AddEnrollmentForm";
import { generateLessonsForEnrollment } from "@/lib/generateLessons";
import type { Enrollment } from "@/types/enrollment";

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
  const [showForm, setShowForm] = useState(false);

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
              className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
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

              <button
                onClick={() => handleGenerate(enrollment)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
              >
                生成未來 4 週
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
