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
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold">繳費與堂數</h1>

        <LessonBalanceCards balance={balance} />

        <p className="mt-3 text-xs text-zinc-600">
          每門課分開計算：剩餘堂數 = 已購買 −
          已上課。已取消的課與臨時加的單堂課不扣堂數。
        </p>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">繳費紀錄</h2>

          {balance.payments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
              目前沒有繳費紀錄
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-800">
              {balance.payments.map((payment) => {
                const enrollment = balance.enrollments.find(
                  (item) => item.enrollmentId === payment.enrollment_id,
                );

                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-4 border-b border-zinc-800 p-5 last:border-b-0"
                  >
                    <div>
                      <div className="font-medium">{payment.paid_at}</div>

                      <div className="mt-1 text-sm text-zinc-500">
                        {enrollment ? enrollmentLabel(enrollment) : "其他"}
                        {payment.note && ` · ${payment.note}`}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-medium">
                        {payment.lesson_count} 堂
                      </div>

                      <div className="mt-1 text-sm text-zinc-500">
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
