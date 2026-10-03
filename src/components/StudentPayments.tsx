"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  enrollmentLabel,
  type EnrollmentBalance,
  type Payment,
} from "@/lib/lessonBalance";

type Props = {
  studentId: number;
  enrollments: EnrollmentBalance[];
  payments: Payment[];
  today: string;
};

/*
 * 固定高度，讓 date / number / select 在各瀏覽器都對齊
 */
const inputClassName =
  "block h-12 w-full rounded-xl bg-background px-4 text-foreground outline-none ring-1 ring-line focus:ring-foreground/30 [color-scheme:dark]";

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm text-muted">{label}</label>
      {children}
    </div>
  );
}

export default function StudentPayments({
  studentId,
  enrollments,
  payments,
  today,
}: Props) {
  const router = useRouter();

  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.active,
  );

  const [enrollmentId, setEnrollmentId] = useState(
    activeEnrollments.length === 1
      ? String(activeEnrollments[0].enrollmentId)
      : "",
  );
  const [paidAt, setPaidAt] = useState(today);
  const [amount, setAmount] = useState("");
  const [amountEdited, setAmountEdited] = useState(false);
  const [lessonCount, setLessonCount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const selectedEnrollment = enrollments.find(
    (enrollment) => enrollment.enrollmentId === Number(enrollmentId),
  );

  /*
   * 金額預設 = 單堂價格 × 堂數，手動改過就不再自動帶入
   */
  function suggestAmount(nextEnrollmentId: string, nextLessonCount: string) {
    if (amountEdited) {
      return;
    }

    const enrollment = enrollments.find(
      (item) => item.enrollmentId === Number(nextEnrollmentId),
    );

    const count = Number(nextLessonCount);

    setAmount(
      enrollment && count > 0 ? String(enrollment.price * count) : "",
    );
  }

  async function addPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);

    try {
      const response = await fetch("/api/admin/students/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          enrollmentId: Number(enrollmentId),
          paidAt,
          amount: Number(amount),
          lessonCount: Number(lessonCount),
          note,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(
          result.error ??
            `新增繳費紀錄失敗（HTTP ${response.status}）`,
        );
        return;
      }

      setAmount("");
      setAmountEdited(false);
      setLessonCount("");
      setNote("");

      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function deletePayment(payment: Payment) {
    if (
      !confirm(
        `確定要刪除 ${payment.paid_at} 的繳費紀錄（${payment.lesson_count} 堂）嗎？`,
      )
    ) {
      return;
    }

    setDeletingId(payment.id);

    try {
      const response = await fetch("/api/admin/students/payments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentId: payment.id }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(
          result.error ??
            `刪除繳費紀錄失敗（HTTP ${response.status}）`,
        );
        return;
      }

      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  function paymentEnrollmentLabel(payment: Payment) {
    const enrollment = enrollments.find(
      (item) => item.enrollmentId === payment.enrollment_id,
    );

    return enrollment ? enrollmentLabel(enrollment) : null;
  }

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-semibold">繳費紀錄</h2>

      {activeEnrollments.length === 0 ? (
        <div className="mb-6 rounded-2xl border border-dashed border-line p-5 text-sm text-muted">
          這位學生還沒有固定課程，請先到「固定課程」建立後再登記繳費。
        </div>
      ) : (
        <form
          onSubmit={addPayment}
          className="mb-6 grid gap-x-3 gap-y-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2"
        >
          <Field label="固定課程" className="sm:col-span-2">
            <select
              value={enrollmentId}
              onChange={(e) => {
                setEnrollmentId(e.target.value);
                suggestAmount(e.target.value, lessonCount);
              }}
              className={inputClassName}
              required
            >
              <option value="">選擇固定課程</option>

              {activeEnrollments.map((enrollment) => (
                <option
                  key={enrollment.enrollmentId}
                  value={enrollment.enrollmentId}
                >
                  {enrollmentLabel(enrollment)}（單堂 $
                  {enrollment.price}）
                </option>
              ))}
            </select>
          </Field>

          <Field label="購買堂數">
            <input
              type="number"
              min="1"
              step="1"
              placeholder="例如 10"
              value={lessonCount}
              onChange={(e) => {
                setLessonCount(e.target.value);
                suggestAmount(enrollmentId, e.target.value);
              }}
              className={inputClassName}
              required
            />
          </Field>

          <Field label="金額">
            <input
              type="number"
              min="0"
              step="1"
              placeholder="例如 12000"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setAmountEdited(true);
              }}
              className={inputClassName}
              required
            />
          </Field>

          <Field label="繳費日期">
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className={inputClassName}
              required
            />
          </Field>

          <Field label="備註（學生看得到）">
            <input
              type="text"
              placeholder="例如 匯款 / 現金"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputClassName}
            />
          </Field>

          {selectedEnrollment &&
            Number(lessonCount) > 0 &&
            amount !== "" &&
            Number(amount) !==
              selectedEnrollment.price * Number(lessonCount) && (
              <p className="rounded-xl bg-warning-soft px-4 py-3 text-xs leading-5 text-warning sm:col-span-2">
                金額和單堂價格 × 堂數（$
                {selectedEnrollment.price * Number(lessonCount)}
                ）不同。月結是用單堂價格計算，如果是套票折扣，建議把固定課程的單堂價格改成實際每堂金額。
              </p>
            )}

          <button
            type="submit"
            disabled={saving}
            className="h-12 w-full rounded-xl bg-primary px-5 font-medium text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
          >
            {saving ? "儲存中..." : "＋ 新增繳費紀錄"}
          </button>
        </form>
      )}

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">
          目前沒有繳費紀錄
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line">
          {payments.map((payment) => {
            const label = paymentEnrollmentLabel(payment);

            return (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-4 border-b border-line p-5 last:border-b-0"
              >
                <div>
                  <div className="font-medium">
                    {payment.paid_at} · {payment.lesson_count} 堂
                  </div>

                  <div className="mt-1 text-sm text-muted">
                    {label ?? (
                      <span className="text-warning">未指定課程</span>
                    )}
                    {" · "}NT$ {payment.amount.toLocaleString()}
                    {payment.note && ` · ${payment.note}`}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deletePayment(payment)}
                  disabled={deletingId === payment.id}
                  className="rounded-xl px-3 py-2 text-sm text-muted hover:bg-fill-strong hover:text-danger disabled:opacity-50"
                >
                  {deletingId === payment.id ? "刪除中..." : "刪除"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
