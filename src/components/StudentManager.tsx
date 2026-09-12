"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Student = {
  id: number;
  name: string;
  active: boolean;
};

type Props = {
  initialStudents: Student[];
};

export default function StudentManager({
  initialStudents,
}: Props) {
  const [students, setStudents] =
    useState<Student[]>(initialStudents);

  const [name, setName] = useState("");

  async function addStudent(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    const { data, error } = await supabase
      .from("students")
      .insert({
        name: trimmedName,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("新增學生失敗");
      return;
    }

    setStudents((currentStudents) => [
      ...currentStudents,
      data,
    ]);

    setName("");
  }

  async function toggleStudentActive(
    student: Student
  ) {
    const newActive = !student.active;

    const { error } = await supabase
      .from("students")
      .update({
        active: newActive,
      })
      .eq("id", student.id);

    if (error) {
      console.error(error);
      alert("更新學生狀態失敗");
      return;
    }

    setStudents((currentStudents) =>
      currentStudents.map((currentStudent) =>
        currentStudent.id === student.id
          ? {
              ...currentStudent,
              active: newActive,
            }
          : currentStudent
      )
    );
  }

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-8 text-3xl font-bold">
          學生管理
        </h1>

        <form
          onSubmit={addStudent}
          className="mb-8 flex gap-3"
        >
          <input
            type="text"
            placeholder="學生姓名"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
          />

          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 font-medium text-black hover:bg-zinc-200"
          >
            ＋ 新增學生
          </button>
        </form>

        <div className="space-y-3">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div>
                <div className="font-medium">
                  {student.name}
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  {student.active
                    ? "使用中"
                    : "已停用"}
                </div>
              </div>

              <button
                onClick={() =>
                  toggleStudentActive(student)
                }
                className={
                  student.active
                    ? "rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                    : "rounded-xl bg-emerald-950 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-900"
                }
              >
                {student.active
                  ? "停用"
                  : "重新啟用"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}