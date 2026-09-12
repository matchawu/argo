"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Teacher = {
  id: number;
  name: string;
  teacher_share: number;
  active: boolean;
};

type Props = {
  initialTeachers: Teacher[];
};

export default function TeacherManager({
  initialTeachers,
}: Props) {
  const [teachers, setTeachers] =
    useState<Teacher[]>(initialTeachers);

  const [name, setName] = useState("");
  const [share, setShare] = useState("0.6");

  async function addTeacher(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const trimmedName = name.trim();
    const teacherShare = Number(share);

    if (!trimmedName) {
      return;
    }

    if (
      Number.isNaN(teacherShare) ||
      teacherShare < 0 ||
      teacherShare > 1
    ) {
      alert("抽成比例請輸入 0 到 1 之間");
      return;
    }

    const { data, error } = await supabase
      .from("teachers")
      .insert({
        name: trimmedName,
        teacher_share: teacherShare,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("新增老師失敗");
      return;
    }

    setTeachers((currentTeachers) => [
      ...currentTeachers,
      data,
    ]);

    setName("");
    setShare("0.6");
  }

  async function toggleTeacherActive(
    teacher: Teacher
  ) {
    const newActive = !teacher.active;

    const { error } = await supabase
      .from("teachers")
      .update({
        active: newActive,
      })
      .eq("id", teacher.id);

    if (error) {
      console.error(error);
      alert("更新老師狀態失敗");
      return;
    }

    setTeachers((currentTeachers) =>
      currentTeachers.map((currentTeacher) =>
        currentTeacher.id === teacher.id
          ? {
              ...currentTeacher,
              active: newActive,
            }
          : currentTeacher
      )
    );
  }

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-8 text-3xl font-bold">
          老師管理
        </h1>

        <form
          onSubmit={addTeacher}
          className="mb-8 grid gap-3 md:grid-cols-[1fr_180px_auto]"
        >
          <input
            type="text"
            placeholder="老師姓名"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="rounded-xl bg-zinc-900 px-4 py-3 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
            required
          />

          <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            placeholder="抽成比例"
            value={share}
            onChange={(e) =>
              setShare(e.target.value)
            }
            className="rounded-xl bg-zinc-900 px-4 py-3 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
            required
          />

          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 font-medium text-black hover:bg-zinc-200"
          >
            ＋ 新增老師
          </button>
        </form>

        <div className="space-y-3">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div>
                <div className="font-medium">
                  {teacher.name}
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  老師抽成{" "}
                  {(teacher.teacher_share * 100).toFixed(0)}
                  %
                  {" · "}
                  {teacher.active
                    ? "使用中"
                    : "已停用"}
                </div>
              </div>

              <button
                onClick={() =>
                  toggleTeacherActive(teacher)
                }
                className={
                  teacher.active
                    ? "rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                    : "rounded-xl bg-emerald-950 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-900"
                }
              >
                {teacher.active
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