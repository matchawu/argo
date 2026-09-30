"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Lesson } from "@/types/lesson";

type StudentOption = {
  id: number;
  name: string;
};

type TeacherOption = {
  id: number;
  name: string;
  teacher_share: number;
};

type EnrollmentOption = {
  id: number;
  student_id: number;
  teacher_id: number;
  course: string;
  price: number;
};

const NO_DEDUCTION = "none";

type Props = {
  onAddLesson: (
    lesson: Lesson,
  ) => Promise<void> | void;
  onCancel: () => void;
  initialDate?: string;
};

export default function AddLessonForm({
  onAddLesson,
  onCancel,
  initialDate,
}: Props) {
  const [students, setStudents] = useState<
    StudentOption[]
  >([]);

  const [teachers, setTeachers] = useState<
    TeacherOption[]
  >([]);

  const [enrollments, setEnrollments] = useState<
    EnrollmentOption[]
  >([]);

  const [studentId, setStudentId] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [course, setCourse] = useState("");
  const [date, setDate] = useState(
    initialDate ?? "",
  );
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadOptions() {
      const [
        { data: studentData, error: studentError },
        { data: teacherData, error: teacherError },
        { data: enrollmentData, error: enrollmentError },
      ] = await Promise.all([
        supabase
          .from("students")
          .select("id, name")
          .eq("active", true)
          .order("name"),

        supabase
          .from("teachers")
          .select("id, name, teacher_share")
          .eq("active", true)
          .order("name"),

        supabase
          .from("enrollments")
          .select("id, student_id, teacher_id, course, price")
          .eq("active", true)
          .order("id"),
      ]);

      if (studentError) {
        console.error(studentError);
      }

      if (teacherError) {
        console.error(teacherError);
      }

      if (enrollmentError) {
        console.error(enrollmentError);
      }

      setStudents(studentData ?? []);
      setTeachers(teacherData ?? []);
      setEnrollments(enrollmentData ?? []);
      setLoading(false);
    }

    loadOptions();
  }, []);

  const studentEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.student_id === Number(studentId),
  );

  /*
   * 選了扣堂課程 → 帶入老師 / 課程 / 學費（之後仍可修改）
   */
  function selectEnrollment(nextEnrollmentId: string) {
    setEnrollmentId(nextEnrollmentId);

    const enrollment = enrollments.find(
      (item) => item.id === Number(nextEnrollmentId),
    );

    if (!enrollment) {
      return;
    }

    setTeacherId(String(enrollment.teacher_id));
    setCourse(enrollment.course);
    setPrice(String(enrollment.price));
  }

  function selectStudent(nextStudentId: string) {
    setStudentId(nextStudentId);

    const options = enrollments.filter(
      (enrollment) =>
        enrollment.student_id === Number(nextStudentId),
    );

    if (options.length === 1) {
      selectEnrollment(String(options[0].id));
    } else {
      setEnrollmentId(options.length === 0 ? NO_DEDUCTION : "");
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const selectedStudent = students.find(
      (student) =>
        student.id === Number(studentId),
    );

    const selectedTeacher = teachers.find(
      (teacher) =>
        teacher.id === Number(teacherId),
    );

    if (!enrollmentId) {
      alert("請選擇要扣哪一門課的堂數");
      return;
    }

    if (
      !selectedStudent ||
      !selectedTeacher ||
      !course ||
      !date ||
      !time ||
      !price
    ) {
      alert("請完整填寫課程資料");
      return;
    }

    const numericPrice = Number(price);

    if (
      Number.isNaN(numericPrice) ||
      numericPrice < 0
    ) {
      alert("請輸入正確的學費");
      return;
    }

    setSaving(true);

    const lesson: Lesson = {
      id: Date.now(),

      studentId: selectedStudent.id,
      enrollmentId:
        enrollmentId === NO_DEDUCTION
          ? null
          : Number(enrollmentId),
      teacherId: selectedTeacher.id,
      teacherShare: selectedTeacher.teacher_share,

      student: selectedStudent.name,
      teacher: selectedTeacher.name,

      course,
      date,
      time,
      price: numericPrice,
      status: "scheduled",
    };

    await onAddLesson(lesson);

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 text-sm text-zinc-500">
        載入學生與老師資料中...
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
    >
      <h3 className="mb-5 text-lg font-semibold">
        新增課程
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            學生
          </label>

          <select
            value={studentId}
            onChange={(event) =>
              selectStudent(event.target.value)
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-zinc-500"
          >
            <option value="">
              請選擇學生
            </option>

            {students.map((student) => (
              <option
                key={student.id}
                value={student.id}
              >
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            扣堂數
          </label>

          <select
            value={enrollmentId}
            onChange={(event) =>
              selectEnrollment(event.target.value)
            }
            disabled={!studentId}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-zinc-500 disabled:opacity-50"
          >
            <option value="">
              {studentId
                ? "請選擇扣哪一門課"
                : "請先選擇學生"}
            </option>

            {studentEnrollments.map((enrollment) => (
              <option
                key={enrollment.id}
                value={enrollment.id}
              >
                {enrollment.course} ·{" "}
                {teachers.find(
                  (teacher) =>
                    teacher.id === enrollment.teacher_id,
                )?.name ?? ""}{" "}
                老師
              </option>
            ))}

            <option value={NO_DEDUCTION}>
              不扣堂數（例如試聽）
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            老師
          </label>

          <select
            value={teacherId}
            onChange={(event) =>
              setTeacherId(event.target.value)
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-zinc-500"
          >
            <option value="">
              請選擇老師
            </option>

            {teachers.map((teacher) => (
              <option
                key={teacher.id}
                value={teacher.id}
              >
                {teacher.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            課程
          </label>

          <input
            type="text"
            value={course}
            onChange={(event) =>
              setCourse(event.target.value)
            }
            placeholder="例如：電吉他"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            學費
          </label>

          <input
            type="number"
            min="0"
            value={price}
            onChange={(event) =>
              setPrice(event.target.value)
            }
            placeholder="例如：750"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            日期
          </label>

          <input
            type="date"
            value={date}
            onChange={(event) =>
              setDate(event.target.value)
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-zinc-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">
            時間
          </label>

          <input
            type="time"
            value={time}
            onChange={(event) =>
              setTime(event.target.value)
            }
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100 outline-none focus:border-zinc-500"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
        >
          取消
        </button>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "新增中..." : "新增課程"}
        </button>
      </div>
    </form>
  );
}