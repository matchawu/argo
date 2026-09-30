import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/requireAdmin";
import {
  buildInviteUrl,
  createInviteToken,
} from "@/lib/invite";

/*
 * 產生學生登入邀請連結
 *
 * 舊連結立即失效。
 * 已綁定的學生也可以用新連結重新綁定 LINE。
 */
export async function POST(request: Request) {
  const denied = await requireAdminApi();

  if (denied) {
    return denied;
  }

  const body = await request.json();
  const studentId = Number(body.studentId);

  if (
    !Number.isInteger(studentId) ||
    studentId <= 0
  ) {
    return NextResponse.json(
      { error: "學生 ID 不正確" },
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

  const invite = createInviteToken();

  const { data: student, error } = await createAdminClient()
    .from("students")
    .update({
      invite_token_hash: invite.tokenHash,
      invite_expires_at: invite.expiresAt,
    })
    .eq("id", studentId)
    .select("id, name")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 },
    );
  }

  if (!student) {
    return NextResponse.json(
      { error: "找不到這位學生" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    inviteUrl: buildInviteUrl(siteUrl, invite.token),
  });
}
