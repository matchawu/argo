import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/requireAdmin";

/*
 * 新增繳費紀錄
 */
export async function POST(request: Request) {
  const denied = await requireAdminApi();

  if (denied) {
    return denied;
  }

  const body = await request.json();

  const studentId = Number(body.studentId);
  const enrollmentId = Number(body.enrollmentId);
  const paidAt = String(body.paidAt ?? "");
  const amount = Number(body.amount);
  const lessonCount = Number(body.lessonCount);
  const note = String(body.note ?? "").trim();

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return NextResponse.json(
      { error: "學生 ID 不正確" },
      { status: 400 },
    );
  }

  if (!Number.isInteger(enrollmentId) || enrollmentId <= 0) {
    return NextResponse.json(
      { error: "請選擇固定課程" },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(paidAt)) {
    return NextResponse.json(
      { error: "請輸入繳費日期" },
      { status: 400 },
    );
  }

  if (!Number.isInteger(amount) || amount < 0) {
    return NextResponse.json(
      { error: "金額必須是 0 以上的整數" },
      { status: 400 },
    );
  }

  if (!Number.isInteger(lessonCount) || lessonCount <= 0) {
    return NextResponse.json(
      { error: "堂數必須是 1 以上的整數" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  /*
   * 固定課程必須屬於這位學生
   */
  const { data: enrollment } = await admin
    .from("enrollments")
    .select("id")
    .eq("id", enrollmentId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json(
      { error: "這筆固定課程不屬於這位學生" },
      { status: 400 },
    );
  }

  const { data: payment, error } = await admin
    .from("payments")
    .insert({
      student_id: studentId,
      enrollment_id: enrollmentId,
      paid_at: paidAt,
      amount,
      lesson_count: lessonCount,
      note: note || null,
    })
    .select("id, enrollment_id, paid_at, amount, lesson_count, note")
    .single();

  if (error || !payment) {
    return NextResponse.json(
      { error: error?.message ?? "新增繳費紀錄失敗" },
      { status: 400 },
    );
  }

  return NextResponse.json({ payment });
}

/*
 * 刪除繳費紀錄（登記錯誤時使用）
 */
export async function DELETE(request: Request) {
  const denied = await requireAdminApi();

  if (denied) {
    return denied;
  }

  const body = await request.json();
  const paymentId = Number(body.paymentId);

  if (!Number.isInteger(paymentId) || paymentId <= 0) {
    return NextResponse.json(
      { error: "繳費紀錄 ID 不正確" },
      { status: 400 },
    );
  }

  const { error } = await createAdminClient()
    .from("payments")
    .delete()
    .eq("id", paymentId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
