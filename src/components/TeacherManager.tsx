"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  initialMyTeacherId: number | null;
  teacherIdsWithLogin: number[];
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

function formatTaiwanDateTime(value: string) {
  const date = new Date(value);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

export default function TeacherManager({
  initialTeachers,
  initialMyTeacherId,
  teacherIdsWithLogin,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [myTeacherId, setMyTeacherId] = useState(initialMyTeacherId);
  const [linkingTeacherId, setLinkingTeacherId] = useState<number | null>(
    null,
  );

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

  const [inviteLink, setInviteLink] = useState<{
    teacherName: string;
    url: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  function showInviteLink(teacherName: string, url: string) {
    setInviteLink({ teacherName, url });
    setCopied(false);
  }

  async function copyInviteLink() {
    if (!inviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink.url);
      setCopied(true);
    } catch {
      alert("複製失敗，請手動選取連結");
    }
  }

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

      showInviteLink(result.teacher.name, result.inviteUrl);

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
      const response = await fetch("/api/admin/teachers/regenerate-invite", {
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
        alert(result.error ?? `產生邀請連結失敗（HTTP ${response.status}）`);
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

      showInviteLink(teacher.name, result.inviteUrl);
    } finally {
      setResendingTeacherId(null);
    }
  }

  /*
   * 老闆也是老師：把老師綁到自己的 admin 帳號，或解除綁定
   */
  async function linkSelf(teacher: Teacher, link: boolean) {
    const message = link
      ? `把「${teacher.name}」綁定到你的帳號？綁定後可以從上方「老師模式」查看與簽到這位老師的課。`
      : `解除「${teacher.name}」與你的帳號的綁定？`;

    if (!confirm(message)) {
      return;
    }

    setLinkingTeacherId(teacher.id);

    try {
      const response = await fetch("/api/admin/teachers/link-self", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teacherId: link ? teacher.id : null,
        }),
      });

      const result = await parseResponse(response);

      if (!response.ok) {
        alert(result.error ?? `綁定失敗（HTTP ${response.status}）`);
        return;
      }

      setMyTeacherId(link ? teacher.id : null);

      if (result.teacher) {
        setTeachers((currentTeachers) =>
          currentTeachers.map((currentTeacher) =>
            currentTeacher.id === teacher.id
              ? { ...currentTeacher, ...result.teacher }
              : currentTeacher,
          ),
        );
      }

      // 重新整理 navbar 的「老師模式」連結
      router.refresh();
    } finally {
      setLinkingTeacherId(null);
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
    <main className="min-h-screen text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="mb-8 text-3xl font-bold">老師管理</h1>

        <form onSubmit={addTeacher} className="mb-8 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-muted">老師姓名</label>

            <input
              type="text"
              placeholder="老師姓名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-surface px-4 py-3 outline-none ring-1 ring-line focus:ring-foreground/30"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@example.com"
              className="w-full rounded-xl bg-surface px-4 py-3 outline-none ring-1 ring-line focus:ring-foreground/30"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted">
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
              className="w-full rounded-xl bg-surface px-4 py-3 outline-none ring-1 ring-line focus:ring-foreground/30"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-primary px-5 py-3 font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "建立中..." : "＋ 新增老師並產生邀請連結"}
            </button>
          </div>
        </form>

        {inviteLink && (
          <div className="mb-8 rounded-2xl border border-success/30 bg-success-soft p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium text-success">
                  {inviteLink.teacherName} 的邀請連結
                </div>

                <p className="mt-1 text-xs text-muted">
                  請把連結傳給老師，老師用 LINE 登入後即完成綁定。連結 7
                  天內有效、只能使用一次，離開此頁後無法再次查看。
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInviteLink(null)}
                className="shrink-0 text-sm text-muted hover:text-foreground"
              >
                關閉
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink.url}
                onFocus={(e) => e.target.select()}
                className="min-w-0 flex-1 rounded-lg bg-background px-3 py-2 text-sm text-foreground outline-none ring-1 ring-line-strong"
              />

              <button
                type="button"
                onClick={copyInviteLink}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
              >
                {copied ? "已複製" : "複製"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
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
                      className="min-w-0 flex-1 rounded-lg bg-background px-3 py-2 text-sm outline-none ring-1 ring-line-strong focus:ring-foreground/30"
                    />

                    <button
                      type="button"
                      onClick={() => saveTeacherEmail(teacher)}
                      className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
                    >
                      儲存
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeacherId(null);
                        setEditingEmail("");
                      }}
                      className="rounded-lg bg-fill px-3 py-2 text-sm text-foreground hover:bg-fill-strong"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm text-muted">
                      {teacher.email ?? "尚未設定 Email"}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingTeacherId(teacher.id);
                        setEditingEmail(teacher.email ?? "");
                      }}
                      className="text-xs text-muted underline hover:text-foreground"
                    >
                      {teacher.email ? "修改 Email" : "新增 Email"}
                    </button>
                  </div>
                )}

                <div className="mt-1 text-sm text-muted">
                  老師抽成 {(teacher.teacher_share * 100).toFixed(0)}%{" · "}
                  {teacher.active ? "使用中" : "已停用"}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={
                      teacher.invite_status === "active"
                        ? "rounded-full bg-success-soft px-2.5 py-1 text-xs text-success"
                        : teacher.invite_status === "invited"
                          ? "rounded-full bg-fill px-2.5 py-1 text-xs text-foreground"
                          : "rounded-full bg-fill px-2.5 py-1 text-xs text-muted"
                    }
                  >
                    {getInviteStatusLabel(teacher.invite_status)}
                  </span>

                  {teacher.id === myTeacherId && (
                    <span className="rounded-full bg-fill px-2.5 py-1 text-xs text-foreground">
                      你的帳號
                    </span>
                  )}

                  {teacher.invited_at && teacher.id !== myTeacherId && (
                    <span className="text-xs text-subtle">
                      最近邀請：
                      {formatTaiwanDateTime(teacher.invited_at)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {teacher.id === myTeacherId ? (
                  <button
                    type="button"
                    onClick={() => linkSelf(teacher, false)}
                    disabled={linkingTeacherId === teacher.id}
                    className="rounded-xl bg-fill px-4 py-2 text-sm text-foreground hover:bg-fill-strong disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    解除綁定
                  </button>
                ) : (
                  !myTeacherId &&
                  !teacherIdsWithLogin.includes(teacher.id) && (
                    <button
                      type="button"
                      onClick={() => linkSelf(teacher, true)}
                      disabled={linkingTeacherId === teacher.id}
                      className="rounded-xl bg-fill px-4 py-2 text-sm text-foreground hover:bg-fill-strong disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      綁定到我的帳號
                    </button>
                  )
                )}

                {teacher.email && teacher.id !== myTeacherId && (
                  <button
                    type="button"
                    onClick={() => resendInvite(teacher)}
                    disabled={resendingTeacherId === teacher.id}
                    className="rounded-xl bg-fill px-4 py-2 text-sm text-foreground hover:bg-fill-strong disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resendingTeacherId === teacher.id
                      ? "產生中..."
                      : teacher.invite_status === "active"
                        ? "重新綁定 LINE"
                        : "產生邀請連結"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleTeacherActive(teacher)}
                  className={
                    teacher.active
                      ? "rounded-xl bg-fill px-4 py-2 text-sm text-foreground hover:bg-fill-strong"
                      : "rounded-xl bg-success-soft px-4 py-2 text-sm text-success hover:opacity-80"
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
