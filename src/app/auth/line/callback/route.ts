import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  LINE_OAUTH_COOKIE,
  getLineUserFromCode,
  type LineOAuthCookie,
} from "@/lib/line";
import { findInvite } from "@/lib/invite";
import {
  createLoginProfile,
  homeForRole,
  signInAsUser,
} from "@/lib/authSession";

type AdminClient = ReturnType<typeof createAdminClient>;

function redirectToLogin(
  request: NextRequest,
  error: string,
  extra: Record<string, string> = {},
) {
  const url = new URL("/login", request.url);

  url.searchParams.set("error", error);

  for (const [key, value] of Object.entries(extra)) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url);
}

/*
 * 用邀請 token 把 LINE 帳號綁到老師或學生。
 *
 * 回傳錯誤代碼，成功則回傳 null。
 */
async function bindInvite(
  admin: AdminClient,
  inviteToken: string,
  lineUserId: string,
): Promise<string | null> {
  const invite = await findInvite(admin, inviteToken);

  if (!invite) {
    return "invite_invalid";
  }

  if (!invite.active) {
    return invite.kind === "teacher"
      ? "teacher_inactive"
      : "student_inactive";
  }

  const idColumn =
    invite.kind === "teacher" ? "teacher_id" : "student_id";

  /*
   * 這個 LINE 帳號不能已經綁在別人身上
   */
  const { data: boundProfile } = await admin
    .from("profiles")
    .select("id, role, teacher_id, student_id")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  /*
   * 老師可能已被升級成 admin（老闆也是老師），role 為 admin 也算同一人
   */
  const allowedRoles =
    invite.kind === "teacher" ? ["teacher", "admin"] : ["student"];

  if (
    boundProfile &&
    (!allowedRoles.includes(boundProfile.role) ||
      boundProfile[idColumn] !== invite.id)
  ) {
    return "line_already_bound";
  }

  const { data: existingProfile, error: existingProfileError } =
    await admin
      .from("profiles")
      .select("id")
      .eq(idColumn, invite.id)
      .in("role", allowedRoles)
      .maybeSingle();

  if (existingProfileError) {
    console.error(existingProfileError);
    return "invite_failed";
  }

  if (existingProfile) {
    /*
     * A. 已有登入身份
     *
     * 直接換綁 LINE。
     */
    const { error: updateProfileError } = await admin
      .from("profiles")
      .update({ line_user_id: lineUserId })
      .eq("id", existingProfile.id);

    if (updateProfileError) {
      console.error(updateProfileError);
      return "invite_failed";
    }
  } else {
    /*
     * B. 還沒有登入身份
     *
     * 建 Auth user（不寄信）+ profile。
     */
    if (!invite.email) {
      return "invite_failed";
    }

    const profileId = await createLoginProfile(admin, {
      kind: invite.kind,
      id: invite.id,
      name: invite.name,
      email: invite.email,
      lineUserId,
    });

    if (!profileId) {
      return "invite_failed";
    }
  }

  /*
   * 邀請用過即失效
   */
  const { error: consumeInviteError } =
    invite.kind === "teacher"
      ? await admin
          .from("teachers")
          .update({
            invite_status: "active",
            invite_token_hash: null,
            invite_expires_at: null,
          })
          .eq("id", invite.id)
      : await admin
          .from("students")
          .update({
            invite_token_hash: null,
            invite_expires_at: null,
          })
          .eq("id", invite.id);

  if (consumeInviteError) {
    console.error(consumeInviteError);
  }

  return null;
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  const rawOAuth =
    cookieStore.get(LINE_OAUTH_COOKIE)?.value;

  cookieStore.delete(LINE_OAUTH_COOKIE);

  const params = request.nextUrl.searchParams;

  /*
   * 使用者在 LINE 按了取消
   */
  if (params.get("error")) {
    return redirectToLogin(request, "line_cancelled");
  }

  let oauth: LineOAuthCookie | null = null;

  try {
    oauth = rawOAuth ? JSON.parse(rawOAuth) : null;
  } catch {
    oauth = null;
  }

  const code = params.get("code");

  if (
    !oauth ||
    !code ||
    params.get("state") !== oauth.state
  ) {
    return redirectToLogin(request, "line_state");
  }

  let lineUserId: string;

  try {
    ({ lineUserId } = await getLineUserFromCode({
      code,
      nonce: oauth.nonce,
    }));
  } catch (error) {
    console.error(error);
    return redirectToLogin(request, "line_failed");
  }

  const admin = createAdminClient();

  /*
   * 1. 如果是從邀請連結來，先綁定
   */
  if (oauth.invite) {
    const bindError = await bindInvite(
      admin,
      oauth.invite,
      lineUserId,
    );

    if (bindError) {
      return redirectToLogin(request, bindError);
    }
  }

  /*
   * 2. 用 LINE userId 找登入身份
   */
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, role, teacher_id, student_id")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (profileError) {
    console.error(profileError);
    return redirectToLogin(request, "login_failed");
  }

  if (!profile) {
    return redirectToLogin(request, "not_bound", {
      line_user_id: lineUserId,
    });
  }

  if (profile.role === "teacher") {
    const { data: teacher } = await admin
      .from("teachers")
      .select("active")
      .eq("id", profile.teacher_id)
      .maybeSingle();

    if (!teacher?.active) {
      return redirectToLogin(request, "teacher_inactive");
    }
  }

  if (profile.role === "student") {
    const { data: student } = await admin
      .from("students")
      .select("active")
      .eq("id", profile.student_id)
      .maybeSingle();

    if (!student?.active) {
      return redirectToLogin(request, "student_inactive");
    }
  }

  /*
   * 3. 建立 Supabase session
   */
  if (!(await signInAsUser(admin, profile.id))) {
    return redirectToLogin(request, "login_failed");
  }

  return NextResponse.redirect(
    new URL(homeForRole(profile.role), request.url),
  );
}
