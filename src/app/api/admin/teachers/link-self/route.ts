import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/requireAdmin";

/*
 * 把老師綁定到目前登入的 admin（老闆也是老師）
 *
 * body: { teacherId: number }  綁定
 *       { teacherId: null }    解除綁定
 *
 * 綁定後 admin 可以進入老師模式（/teacher）。
 */
export async function POST(request: Request) {
  const { denied, userId } = await getAdminUser();

  if (denied) {
    return denied;
  }

  const body = await request.json();
  const admin = createAdminClient();

  /*
   * 解除綁定
   */
  if (body.teacherId === null) {
    const { error } = await admin
      .from("profiles")
      .update({ teacher_id: null })
      .eq("id", userId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ teacherId: null });
  }

  const teacherId = Number(body.teacherId);

  if (!Number.isInteger(teacherId) || teacherId <= 0) {
    return NextResponse.json(
      { error: "老師 ID 不正確" },
      { status: 400 },
    );
  }

  const { data: teacher } = await admin
    .from("teachers")
    .select("id")
    .eq("id", teacherId)
    .maybeSingle();

  if (!teacher) {
    return NextResponse.json(
      { error: "找不到這位老師" },
      { status: 404 },
    );
  }

  /*
   * 這位老師不能已經有其他登入身份
   * （已用邀請連結綁 LINE 的老師，或已綁定其他 admin）
   */
  const { data: otherProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("teacher_id", teacherId)
    .neq("id", userId)
    .maybeSingle();

  if (otherProfile) {
    return NextResponse.json(
      {
        error:
          "這位老師已經有自己的登入帳號，無法綁定到你的帳號",
      },
      { status: 409 },
    );
  }

  const { error: updateProfileError } = await admin
    .from("profiles")
    .update({ teacher_id: teacherId })
    .eq("id", userId);

  if (updateProfileError) {
    return NextResponse.json(
      { error: updateProfileError.message },
      { status: 500 },
    );
  }

  /*
   * 不需要邀請連結了
   */
  const { data: updatedTeacher } = await admin
    .from("teachers")
    .update({
      invite_status: "active",
      invite_token_hash: null,
      invite_expires_at: null,
    })
    .eq("id", teacherId)
    .select(
      "id, name, email, teacher_share, active, invite_status, invited_at",
    )
    .single();

  return NextResponse.json({
    teacherId,
    teacher: updatedTeacher,
  });
}
