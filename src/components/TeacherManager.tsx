"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Teacher = {
  id: number;
  name: string;
  email: string | null;
  teacher_share: number;
  active: boolean;
  invite_status: "not_invited" | "invited" | "active";
  invited_at: string | null;
};

type Props = {
  initialTeachers: Teacher[];
};

function getInviteStatusLabel(status: Teacher["invite_status"]) {
  switch (status) {
    case "not_invited":
      return "未邀請";
    case "invited":
      return "已邀請";
    case "active":
      return "已啟用";
  }
}

export default function TeacherManager({ initialTeachers }: Props) {
  const supabase = createClient();

  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [share, setShare] = useState("0.6");
  const [saving, setSaving] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);

  const [editingEmail, setEditingEmail] = useState("");

  const [resendingTeacherId, setResendingTeacherId] = useState<number | null>(
    null,
  );

  async function parseResponse(response: Response) {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

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

    try {
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

      const result = await parseResponse(response);

      if (!response.ok) {
        if (result.teacher) {
          setTeachers((currentTeachers) => [
            ...currentTeachers,
            result.teacher,
          ]);

          setName("");
          setEmail("");
          setShare("0.6");
        }

        alert(result.error ?? `新增老師失敗（HTTP ${response.status}）`);

        return;
      }

      setTeachers((currentTeachers) => [...currentTeachers, result.teacher]);

      setName("");
      setEmail("");
      setShare("0.6");
    } finally {
      setSaving(false);
    }
  }

  async function resendInvite(teacher: Teacher) {
    if (!teacher.email) {
      alert("這位老師沒有 Email");
      return;
    }

    setResendingTeacherId(teacher.id);

    try {
      const response = await fetch("/api/admin/teachers/resend-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: teacher.id,
        }),
      });

      const result = await parseResponse(response);

      if (!response.ok) {
        alert(result.error ?? `重新寄送失敗（HTTP ${response.status}）`);
        return;
      }

      setTeachers((currentTeachers) =>
        currentTeachers.map((currentTeacher) =>
          currentTeacher.id === teacher.id
            ? {
                ...currentTeacher,
                invite_status: result.teacher?.invite_status ?? "invited",
                invited_at:
                  result.teacher?.invited_at ?? new Date().toISOString(),
              }
            : currentTeacher,
        ),
      );

      alert("邀請信已重新寄出");
    } finally {
      setResendingTeacherId(null);
    }
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

  async function saveTeacherEmail(teacher: Teacher) {
    const trimmedEmail = editingEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      alert("請輸入 Email");
      return;
    }

    const { error } = await supabase
      .from("teachers")
      .update({
        email: trimmedEmail,
      })
      .eq("id", teacher.id);

    if (error) {
      console.error(error);
      alert("更新 Email 失敗");
      return;
    }

    setTeachers((currentTeachers) =>
      currentTeachers.map((currentTeacher) =>
        currentTeacher.id === teacher.id
          ? {
              ...currentTeacher,
              email: trimmedEmail,
            }
          : currentTeacher,
      ),
    );

    setEditingTeacherId(null);
    setEditingEmail("");
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
              className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="font-medium">{teacher.name}</div>

                {editingTeacherId === teacher.id ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      type="email"
                      value={editingEmail}
                      onChange={(e) => setEditingEmail(e.target.value)}
                      placeholder="teacher@example.com"
                      className="min-w-0 flex-1 rounded-lg bg-zinc-950 px-3 py-2 text-sm outline-none ring-1 ring-zinc-700 focus:ring-zinc-500"
                    />

                    <button
                      type="button"
                      onClick={() => saveTeacherEmail(teacher)}
                      className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-black hover:bg-zinc-200"
                    >
                      儲存
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeacherId(null);
                        setEditingEmail("");
                      }}
                      className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm text-zinc-500">
                      {teacher.email ?? "尚未設定 Email"}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeacherId(teacher.id);
                        setEditingEmail(teacher.email ?? "");
                      }}
                      className="text-xs text-zinc-400 underline hover:text-zinc-200"
                    >
                      {teacher.email ? "修改 Email" : "新增 Email"}
                    </button>
                  </div>
                )}

                <div className="mt-1 text-sm text-zinc-500">
                  老師抽成 {(teacher.teacher_share * 100).toFixed(0)}%{" · "}
                  {teacher.active ? "使用中" : "已停用"}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={
                      teacher.invite_status === "active"
                        ? "rounded-full bg-emerald-950 px-2.5 py-1 text-xs text-emerald-400"
                        : teacher.invite_status === "invited"
                          ? "rounded-full bg-blue-950 px-2.5 py-1 text-xs text-blue-400"
                          : "rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400"
                    }
                  >
                    {getInviteStatusLabel(teacher.invite_status)}
                  </span>

                  {teacher.invited_at && (
                    <span className="text-xs text-zinc-600">
                      最近邀請：
                      {new Date(teacher.invited_at).toLocaleString("zh-TW")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {teacher.invite_status !== "active" && teacher.email && (
                  <button
                    type="button"
                    onClick={() => resendInvite(teacher)}
                    disabled={resendingTeacherId === teacher.id}
                    className="rounded-xl bg-blue-950 px-4 py-2 text-sm text-blue-300 hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resendingTeacherId === teacher.id
                      ? "寄送中..."
                      : "重新寄送邀請"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleTeacherActive(teacher)}
                  className={
                    teacher.active
                      ? "rounded-xl bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                      : "rounded-xl bg-emerald-950 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-900"
                  }
                >
                  {teacher.active ? "停用" : "重新啟用"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
