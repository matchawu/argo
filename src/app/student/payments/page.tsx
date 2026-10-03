import type { Metadata } from "next";
import { getCurrentStudent } from "@/lib/currentStudent";
import { enrollmentLabel, getLessonBalance } from "@/lib/lessonBalance";
import LessonBalanceCards from "@/components/LessonBalanceCards";

export const metadata: Metadata = {
  title: "繳費與堂數",
};

export default async function StudentPaymentsPage() {
  const { admin, student } = await getCurrentStudent();

  const balance = await getLessonBalance(admin, student.id);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-subtle">
          Lessons &amp; Payments
        </p>

        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          繳費與堂數
        </h1>

        <LessonBalanceCards balance={balance} />

        <p className="mt-3 px-1 text-xs leading-5 text-subtle">
          每門課分開計算：剩餘堂數 = 已購買 −
          已上課。已取消的課與臨時加的單堂課不扣堂數。
        </p>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">繳費紀錄</h2>

          {balance.payments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line-strong p-10 text-center text-sm text-muted">
              目前沒有繳費紀錄
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
              {balance.payments.map((payment) => {
                const enrollment = balance.enrollments.find(
                  (item) => item.enrollmentId === payment.enrollment_id,
                );

                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-4 border-b border-line p-5 last:border-b-0"
                  >
                    <div>
                      <div className="font-display text-lg font-bold">
                        {payment.paid_at.replaceAll("-", ".")}
                      </div>

                      <div className="mt-0.5 text-sm text-muted">
                        {enrollment ? enrollmentLabel(enrollment) : "其他"}
                        {payment.note && ` · ${payment.note}`}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-display text-lg font-bold">
                        {payment.lesson_count}
                        <span className="ml-1 text-sm font-medium text-muted">
                          堂
                        </span>
                      </div>

                      <div className="mt-0.5 text-sm text-muted">
                        NT$ {payment.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
