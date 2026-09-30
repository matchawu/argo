import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildInviteUrl,
  createInviteToken,
} from "@/lib/invite";

export async function POST(request: Request) {
  const supabase = await createClient();

  /*
   * 確認目前登入者
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

  /*
   * 確認是 admin
   */
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
   * 讀取輸入
   */
  const body = await request.json();

  const name = String(
    body.name ?? "",
  ).trim();

  const email = String(
    body.email ?? "",
  )
    .trim()
    .toLowerCase();

  const teacherShare = Number(
    body.teacherShare,
  );

  if (!name || !email) {
    return NextResponse.json(
      {
        error: "姓名與 Email 為必填",
      },
      { status: 400 },
    );
  }

  if (
    Number.isNaN(teacherShare) ||
    teacherShare < 0 ||
    teacherShare > 1
  ) {
    return NextResponse.json(
      {
        error:
          "老師抽成比例必須介於 0 到 1",
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

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
   * 建立老師 + 邀請連結
   *
   * 不建立 Auth user、不寄信。
   * 老師打開邀請連結用 LINE 登入時才建立登入身份。
   */
  const invite = createInviteToken();

  const {
    data: teacher,
    error: teacherError,
  } = await admin
    .from("teachers")
    .insert({
      name,
      email,
      teacher_share: teacherShare,
      active: true,
      invite_status: "invited",
      invited_at: new Date().toISOString(),
      invite_token_hash: invite.tokenHash,
      invite_expires_at: invite.expiresAt,
    })
    .select(
      "id, name, email, teacher_share, active, invite_status, invited_at",
    )
    .single();

  if (teacherError || !teacher) {
    return NextResponse.json(
      {
        error:
          teacherError?.message ??
          "建立老師資料失敗",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    teacher,
    inviteUrl: buildInviteUrl(siteUrl, invite.token),
  });
}
