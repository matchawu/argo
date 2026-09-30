import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildInviteUrl,
  createInviteToken,
} from "@/lib/teacherInvite";

/*
 * 重新產生老師邀請連結
 *
 * 舊連結立即失效。
 * 已啟用的老師也可以用新連結重新綁定 LINE（例如換手機 / 換帳號）。
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const admin = createAdminClient();

  /*
   * 1. 確認目前登入者是 admin
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "未登入" },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "沒有管理員權限" },
      { status: 403 },
    );
  }

  /*
   * 2. 取得 teacherId
   */
  const body = await request.json();
  const teacherId = Number(body.teacherId);

  if (
    !Number.isInteger(teacherId) ||
    teacherId <= 0
  ) {
    return NextResponse.json(
      { error: "老師 ID 不正確" },
      { status: 400 },
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return NextResponse.json(
      {
        error:
          "伺服器缺少 NEXT_PUBLIC_SITE_URL 設定",
      },
      { status: 500 },
    );
  }

  /*
   * 3. 找老師
   */
  const {
    data: teacher,
    error: teacherError,
  } = await admin
    .from("teachers")
    .select("id, email, invite_status")
    .eq("id", teacherId)
    .single();

  if (teacherError || !teacher) {
    return NextResponse.json(
      { error: "找不到這位老師" },
      { status: 404 },
    );
  }

  if (!teacher.email) {
    return NextResponse.json(
      { error: "這位老師沒有 Email" },
      { status: 400 },
    );
  }

  /*
   * 4. 換新的邀請 token
   */
  const invite = createInviteToken();

  const {
    data: updatedTeacher,
    error: updateError,
  } = await admin
    .from("teachers")
    .update({
      invite_status:
        teacher.invite_status === "active"
          ? "active"
          : "invited",
      invited_at: new Date().toISOString(),
      invite_token_hash: invite.tokenHash,
      invite_expires_at: invite.expiresAt,
    })
    .eq("id", teacher.id)
    .select(
      "id, name, email, teacher_share, active, invite_status, invited_at",
    )
    .single();

  if (updateError || !updatedTeacher) {
    return NextResponse.json(
      {
        error:
          updateError?.message ??
          "更新邀請狀態失敗",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    teacher: updatedTeacher,
    inviteUrl: buildInviteUrl(siteUrl, invite.token),
  });
}
