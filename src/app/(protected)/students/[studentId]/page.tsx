import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLessonBalance } from "@/lib/lessonBalance";
import { getTodayInTaiwan } from "@/lib/date";
import StudentLoginInvite from "@/components/StudentLoginInvite";
import StudentPayments from "@/components/StudentPayments";
import LessonBalanceCards from "@/components/LessonBalanceCards";

export const metadata: Metadata = {
  title: "學生詳情",
};

type Props = {
  params: Promise<{
    studentId: string;
  }>;
};

/*
 * admin 已由 (protected)/layout.tsx 驗證
 */
export default async function StudentDetailPage({ params }: Props) {
  const { studentId } = await params;

  const numericStudentId = Number(studentId);

  if (!Number.isInteger(numericStudentId)) {
    notFound();
  }

  const admin = createAdminClient();

  const [{ data: student }, { data: profile }] = await Promise.all([
    admin
      .from("students")
      .select("id, name, active")
      .eq("id", numericStudentId)
      .maybeSingle(),

    admin
      .from("profiles")
      .select("line_user_id")
      .eq("role", "student")
      .eq("student_id", numericStudentId)
      .maybeSingle(),
  ]);

  if (!student) {
    notFound();
  }

  const balance = await getLessonBalance(admin, numericStudentId);

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <Link
          href="/students"
          className="text-sm text-zinc-500 transition hover:text-zinc-300"
        >
          ← 返回學生管理
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <h1 className="text-3xl font-bold">{student.name}</h1>

          {!student.active && (
            <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-500">
              已停用
            </span>
          )}
        </div>

        <LessonBalanceCards balance={balance} />

        <StudentLoginInvite
          studentId={student.id}
          studentName={student.name}
          lineBound={Boolean(profile?.line_user_id)}
        />

        <StudentPayments
          studentId={student.id}
          enrollments={balance.enrollments}
          payments={balance.payments}
          today={getTodayInTaiwan()}
        />
      </div>
    </main>
  );
}
