"use client";

import { useState } from "react";

type Props = {
  studentId: number;
  studentName: string;
  lineBound: boolean;
};

export default function StudentLoginInvite({
  studentId,
  studentName,
  lineBound,
}: Props) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateInvite() {
    setLoading(true);

    try {
      const response = await fetch(
        "/api/admin/students/regenerate-invite",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentId }),
        },
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(
          result.error ??
            `產生登入連結失敗（HTTP ${response.status}）`,
        );
        return;
      }

      setInviteUrl(result.inviteUrl);
      setCopied(false);
    } finally {
      setLoading(false);
    }
  }

  async function copyInviteUrl() {
    if (!inviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      alert("複製失敗，請手動選取連結");
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">學生登入</h2>

          <div className="mt-2">
            <span
              className={
                lineBound
                  ? "rounded-full bg-success-soft px-2.5 py-1 text-xs text-success"
                  : "rounded-full bg-fill px-2.5 py-1 text-xs text-muted"
              }
            >
              {lineBound ? "已綁定 LINE" : "尚未綁定"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={generateInvite}
          disabled={loading}
          className="rounded-xl bg-fill px-4 py-2 text-sm text-foreground hover:bg-fill-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "產生中..."
            : lineBound
              ? "重新綁定 LINE"
              : "產生登入連結"}
        </button>
      </div>

      {inviteUrl && (
        <div className="mt-4 rounded-xl border border-success/30 bg-success-soft p-4">
          <p className="text-xs text-muted">
            請把連結傳給 {studentName}，用 LINE 登入後即完成綁定。連結 7
            天內有效、只能使用一次，離開此頁後無法再次查看。
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 rounded-lg bg-background px-3 py-2 text-sm text-foreground outline-none ring-1 ring-line-strong"
            />

            <button
              type="button"
              onClick={copyInviteUrl}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
            >
              {copied ? "已複製" : "複製"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
