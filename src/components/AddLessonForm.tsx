"use client";

import { useState } from "react";
import type { Lesson } from "@/types/lesson";

type Props = {
  onAddLesson: (lesson: Lesson) => void;
  onCancel: () => void;
};

export default function AddLessonForm({ onAddLesson, onCancel }: Props) {
  const [form, setForm] = useState({
    student: "",
    teacher: "",
    course: "",
    date: "",
    time: "",
    price: "",
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const lesson: Lesson = {
      id: Date.now(),
      student: form.student,
      teacher: form.teacher,
      course: form.course,
      date: form.date,
      time: form.time,
      price: Number(form.price),
      status: "scheduled",
    };

    onAddLesson(lesson);

    setForm({
      student: "",
      teacher: "",
      course: "",
      date: "",
      time: "",
      price: "",
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 md:grid-cols-2"
    >
      <input
        type="text"
        placeholder="學生姓名"
        value={form.student}
        onChange={(e) =>
          setForm({
            ...form,
            student: e.target.value,
          })
        }
        className="rounded-xl bg-zinc-800 px-4 py-3 outline-none"
        required
      />

      <input
        type="text"
        placeholder="老師姓名"
        value={form.teacher}
        onChange={(e) =>
          setForm({
            ...form,
            teacher: e.target.value,
          })
        }
        className="rounded-xl bg-zinc-800 px-4 py-3 outline-none"
        required
      />

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
        className="rounded-xl bg-zinc-800 px-4 py-3 outline-none"
        required
      />

      <input
        type="date"
        value={form.date}
        onChange={(e) =>
          setForm({
            ...form,
            date: e.target.value,
          })
        }
        className="rounded-xl bg-zinc-800 px-4 py-3 outline-none"
        required
      />

      <input
        type="time"
        value={form.time}
        onChange={(e) =>
          setForm({
            ...form,
            time: e.target.value,
          })
        }
        className="rounded-xl bg-zinc-800 px-4 py-3 outline-none"
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
        className="rounded-xl bg-zinc-800 px-4 py-3 outline-none"
        required
      />

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-xl bg-white px-4 py-3 font-medium text-black"
        >
          新增
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-zinc-800 px-4 py-3 text-zinc-300"
        >
          取消
        </button>
      </div>
    </form>
  );
}
