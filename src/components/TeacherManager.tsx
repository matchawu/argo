"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Teacher = {
  id: number;
  name: string;
  email: string | null;
  teacher_share: number;
  active: boolean;
};

type Props = {
  initialTeachers: Teacher[];
};

export default function TeacherManager({ initialTeachers }: Props) {
  const supabase = createClient();

  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [share, setShare] = useState("0.6");
  const [saving, setSaving] = useState(false);

  async function addTeacher(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const teacherShare = Number(share);

    if (!trimmedName || !trimmedEmail) {
      alert("請輸入老師姓名與 Email");
      return;
    }

    if (Number.isNaN(teacherShare) || teacherShare < 0 || teacherShare > 1) {
      alert("抽成比例請輸入 0 到 1 之間");
      return;
    }

    setSaving(true);

    const response = await fetch("/api/admin/teachers/invite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: trimmedName,
        email: trimmedEmail,
        teacherShare,
      }),
    });

    const result = await response.json();

    setSaving(false);

    if (!response.ok) {
      alert(result.error ?? "新增老師失敗");
      return;
    }

    setTeachers((currentTeachers) => [...currentTeachers, result.teacher]);

    setName("");
    setEmail("");
    setShare("0.6");
  }

  async function toggleTeacherActive(teacher: Teacher) {
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
          : currentTeacher,
      ),
    );
  }

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-8 text-3xl font-bold">老師管理</h1>

        <form onSubmit={addTeacher} className="mb-8 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-zinc-400">老師姓名</label>

            <input
              type="text"
              placeholder="老師姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@example.com"
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              老師抽成比例
            </label>

            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              placeholder="例如 0.6"
              value={share}
              onChange={(e) => setShare(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 px-4 py-3 outline-none ring-1 ring-zinc-800 focus:ring-zinc-600"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-white px-5 py-3 font-medium text-black hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "建立並寄送邀請中..." : "＋ 新增老師並寄邀請"}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="min-w-0">
                <div className="font-medium">{teacher.name}</div>

                {teacher.email && (
                  <div className="mt-1 truncate text-sm text-zinc-500">
                    {teacher.email}
                  </div>
                )}

                <div className="mt-1 text-sm text-zinc-500">
                  老師抽成 {(teacher.teacher_share * 100).toFixed(0)}%{" · "}
                  {teacher.active ? "使用中" : "已停用"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleTeacherActive(teacher)}
                className={
                  teacher.active
                    ? "shrink-0 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                    : "shrink-0 rounded-xl bg-emerald-950 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-900"
                }
              >
                {teacher.active ? "停用" : "重新啟用"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
