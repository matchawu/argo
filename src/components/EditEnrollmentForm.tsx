"use client";

import { useState } from "react";
import type { Enrollment } from "@/types/enrollment";

type Teacher = {
  id: number;
  name: string;
  teacher_share: number;
};

type Props = {
  enrollment: Enrollment;
  teachers: Teacher[];
  onSave: (values: {
    teacherId: number;
    course: string;
    price: number;
    weekday: number;
    time: string;
    updateFutureLessons: boolean;
  }) => Promise<void>;
  onCancel: () => void;
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

export default function EditEnrollmentForm({
  enrollment,
  teachers,
  onSave,
  onCancel,
}: Props) {
  const [teacherId, setTeacherId] = useState(
    enrollment.teacher_id.toString(),
  );

  const [course, setCourse] = useState(enrollment.course);
  const [price, setPrice] = useState(enrollment.price.toString());
  const [weekday, setWeekday] = useState(
    enrollment.default_weekday.toString(),
  );
  const [time, setTime] = useState(
    enrollment.default_time.slice(0, 5),
  );

  const [updateFutureLessons, setUpdateFutureLessons] =
    useState(true);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    await onSave({
      teacherId: Number(teacherId),
      course,
      price: Number(price),
      weekday: Number(weekday),
      time,
      updateFutureLessons,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 grid gap-4 rounded-xl border border-zinc-700 bg-zinc-950 p-4 md:grid-cols-2"
    >
      <select
        value={teacherId}
        onChange={(e) => setTeacherId(e.target.value)}
        className="rounded-xl bg-zinc-800 px-4 py-3"
      >
        {teachers.map((teacher) => (
          <option
            key={teacher.id}
            value={teacher.id}
          >
            {teacher.name}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={course}
        onChange={(e) => setCourse(e.target.value)}
        placeholder="課程"
        className="rounded-xl bg-zinc-800 px-4 py-3"
      />

      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="單堂價格"
        className="rounded-xl bg-zinc-800 px-4 py-3"
      />

      <select
        value={weekday}
        onChange={(e) => setWeekday(e.target.value)}
        className="rounded-xl bg-zinc-800 px-4 py-3"
      >
        {weekdayOptions.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="rounded-xl bg-zinc-800 px-4 py-3"
      />

      <label className="flex items-center gap-2 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={updateFutureLessons}
          onChange={(e) =>
            setUpdateFutureLessons(e.target.checked)
          }
        />

        同步更新未來尚未完成課程
      </label>

      <div className="flex gap-3 md:col-span-2">
        <button
          type="submit"
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black"
        >
          儲存
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-300"
        >
          取消
        </button>
      </div>
    </form>
  );
}