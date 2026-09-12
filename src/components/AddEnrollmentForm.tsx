"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateLessonsForEnrollment } from "@/lib/generateLessons";

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
  students: Student[];
  teachers: Teacher[];
  onCreated: () => void;
};

const weekdayOptions = [
  { value: 0, label: "星期日" },
  { value: 1, label: "星期一" },
  { value: 2, label: "星期二" },
  { value: 3, label: "星期三" },
  { value: 4, label: "星期四" },
  { value: 5, label: "星期五" },
  { value: 6, label: "星期六" },
];

export default function AddEnrollmentForm({
  students,
  teachers,
  onCreated,
}: Props) {
  const [form, setForm] = useState({
    studentId: "",
    teacherId: "",
    course: "",
    price: "",
    weekday: "0",
    time: "",
    startDate: "",
  });

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const selectedStudent = students.find(
      (student) => student.id === Number(form.studentId)
    );

    const selectedTeacher = teachers.find(
      (teacher) => teacher.id === Number(form.teacherId)
    );

    if (!selectedStudent || !selectedTeacher) {
      alert("學生或老師資料不正確");
      return;
    }

    const { data, error } = await supabase
      .from("enrollments")
      .insert({
        student_id: Number(form.studentId),
        teacher_id: Number(form.teacherId),
        course: form.course,
        price: Number(form.price),
        default_weekday: Number(form.weekday),
        default_time: form.time,
        start_date: form.startDate,
        active: true,
      })
      .select(`
        *,
        students (
          name
        ),
        teachers (
          name,
          teacher_share
        )
      `)
      .single();

    if (error) {
      console.error(error);
      alert("新增固定課程失敗");
      return;
    }

    try {
      await generateLessonsForEnrollment(data, 4);
    } catch (error) {
      console.error(error);
      alert("固定課程已建立，但產生未來課程失敗");
      return;
    }

    setForm({
      studentId: "",
      teacherId: "",
      course: "",
      price: "",
      weekday: "0",
      time: "",
      startDate: "",
    });

    onCreated();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 md:grid-cols-2"
    >
      <select
        value={form.studentId}
        onChange={(e) =>
          setForm({
            ...form,
            studentId: e.target.value,
          })
        }
        className="rounded-xl bg-zinc-800 px-4 py-3"
        required
      >
        <option value="">選擇學生</option>

        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.name}
          </option>
        ))}
      </select>

      <select
        value={form.teacherId}
        onChange={(e) =>
          setForm({
            ...form,
            teacherId: e.target.value,
          })
        }
        className="rounded-xl bg-zinc-800 px-4 py-3"
        required
      >
        <option value="">選擇老師</option>

        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="課程，例如：電吉他"
        value={form.course}
        onChange={(e) =>
          setForm({
            ...form,
            course: e.target.value,
          })
        }
        className="rounded-xl bg-zinc-800 px-4 py-3"
        required
      />

      <input
        type="number"
        placeholder="單堂價格"
        value={form.price}
        onChange={(e) =>
          setForm({
            ...form,
            price: e.target.value,
          })
        }
        className="rounded-xl bg-zinc-800 px-4 py-3"
        required
      />

      <select
        value={form.weekday}
        onChange={(e) =>
          setForm({
            ...form,
            weekday: e.target.value,
          })
        }
        className="rounded-xl bg-zinc-800 px-4 py-3"
      >
        {weekdayOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <input
        type="time"
        value={form.time}
        onChange={(e) =>
          setForm({
            ...form,
            time: e.target.value,
          })
        }
        className="rounded-xl bg-zinc-800 px-4 py-3"
        required
      />

      <input
        type="date"
        value={form.startDate}
        onChange={(e) =>
          setForm({
            ...form,
            startDate: e.target.value,
          })
        }
        className="rounded-xl bg-zinc-800 px-4 py-3"
        required
      />

      <button
        type="submit"
        className="rounded-xl bg-white px-4 py-3 font-medium text-black hover:bg-zinc-200"
      >
        建立固定課程
      </button>
    </form>
  );
}