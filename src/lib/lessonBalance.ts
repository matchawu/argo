import type { createAdminClient } from "@/lib/supabase/admin";

export type Payment = {
  id: number;
  enrollment_id: number | null;
  paid_at: string;
  amount: number;
  lesson_count: number;
  note: string | null;
};

export type EnrollmentBalance = {
  enrollmentId: number;
  course: string;
  teacher: string;
  price: number;
  intervalWeeks: number;
  active: boolean;
  purchased: number;
  used: number;
  scheduled: number;
  remaining: number;
};

export type LessonBalance = {
  enrollments: EnrollmentBalance[];
  payments: Payment[];
};

/*
 * 預購堂數，每一筆固定課程分開計算
 *
 * 已購買 = 這筆固定課程的繳費堂數加總
 * 已使用 = 這筆固定課程已完成（completed）的課
 * 剩餘   = 已購買 − 已使用
 *
 * 已取消的課不扣堂；不屬於固定課程的單堂課也不扣堂。
 */
export async function getLessonBalance(
  admin: ReturnType<typeof createAdminClient>,
  studentId: number,
): Promise<LessonBalance> {
  const [
    { data: enrollments, error: enrollmentsError },
    { data: payments, error: paymentsError },
    { data: lessons, error: lessonsError },
  ] = await Promise.all([
    admin
      .from("enrollments")
      .select("id, course, price, interval_weeks, active, teachers ( name )")
      .eq("student_id", studentId)
      .order("id"),

    admin
      .from("payments")
      .select("id, enrollment_id, paid_at, amount, lesson_count, note")
      .eq("student_id", studentId)
      .order("paid_at", { ascending: false })
      .order("id", { ascending: false }),

    admin
      .from("lessons")
      .select("enrollment_id, status")
      .eq("student_id", studentId)
      .not("enrollment_id", "is", null)
      .in("status", ["completed", "scheduled"]),
  ]);

  const error = enrollmentsError ?? paymentsError ?? lessonsError;

  if (error) {
    throw error;
  }

  const balances = (enrollments ?? []).map((enrollment) => {
    const purchased = (payments ?? [])
      .filter((payment) => payment.enrollment_id === enrollment.id)
      .reduce((sum, payment) => sum + payment.lesson_count, 0);

    const enrollmentLessons = (lessons ?? []).filter(
      (lesson) => lesson.enrollment_id === enrollment.id,
    );

    const used = enrollmentLessons.filter(
      (lesson) => lesson.status === "completed",
    ).length;

    const scheduled = enrollmentLessons.filter(
      (lesson) => lesson.status === "scheduled",
    ).length;

    const teacher = enrollment.teachers as
      | { name: string }
      | { name: string }[]
      | null;

    return {
      enrollmentId: enrollment.id,
      course: enrollment.course,
      teacher: (Array.isArray(teacher) ? teacher[0]?.name : teacher?.name) ?? "",
      price: enrollment.price,
      intervalWeeks: enrollment.interval_weeks ?? 1,
      active: enrollment.active,
      purchased,
      used,
      scheduled,
      remaining: purchased - used,
    };
  });

  return {
    /*
     * 已停用、而且沒有任何繳費 / 上課紀錄的固定課程不顯示
     */
    enrollments: balances.filter(
      (balance) =>
        balance.active ||
        balance.purchased > 0 ||
        balance.used > 0,
    ),
    payments: payments ?? [],
  };
}

export function enrollmentLabel(balance: EnrollmentBalance) {
  return `${balance.course} · ${balance.teacher} 老師`;
}
