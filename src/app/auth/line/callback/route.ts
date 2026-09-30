import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  LINE_OAUTH_COOKIE,
  getLineUserFromCode,
  type LineOAuthCookie,
} from "@/lib/line";
import { hashInviteToken } from "@/lib/teacherInvite";

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
 * 用邀請 token 把 LINE 帳號綁到老師。
 *
 * 回傳錯誤代碼，成功則回傳 null。
 */
async function bindTeacherInvite(
  admin: AdminClient,
  inviteToken: string,
  lineUserId: string,
): Promise<string | null> {
  const tokenHash = hashInviteToken(inviteToken);

  const { data: teacher } = await admin
    .from("teachers")
    .select("id, name, email, active, invite_expires_at")
    .eq("invite_token_hash", tokenHash)
    .maybeSingle();

  if (
    !teacher ||
    !teacher.invite_expires_at ||
    new Date(teacher.invite_expires_at) < new Date()
  ) {
    return "invite_invalid";
  }

  if (!teacher.active) {
    return "teacher_inactive";
  }

  /*
   * 這個 LINE 帳號不能已經綁在別人身上
   */
  const { data: boundProfile } = await admin
    .from("profiles")
    .select("id, teacher_id")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (
    boundProfile &&
    boundProfile.teacher_id !== teacher.id
  ) {
    return "line_already_bound";
  }

  const { data: teacherProfile, error: teacherProfileError } =
    await admin
      .from("profiles")
      .select("id")
      .eq("teacher_id", teacher.id)
      .eq("role", "teacher")
      .maybeSingle();

  if (teacherProfileError) {
    console.error(teacherProfileError);
    return "invite_failed";
  }

  if (teacherProfile) {
    /*
     * A. 已有登入身份（例如舊的 Email 邀請帳號）
     *
     * 直接換綁 LINE。
     */
    const { error: updateProfileError } = await admin
      .from("profiles")
      .update({ line_user_id: lineUserId })
      .eq("id", teacherProfile.id);

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
    if (!teacher.email) {
      return "invite_failed";
    }

    const { data: created, error: createUserError } =
      await admin.auth.admin.createUser({
        email: teacher.email,
        email_confirm: true,
        user_metadata: {
          name: teacher.name,
          role: "teacher",
        },
      });

    if (createUserError || !created.user) {
      console.error(createUserError);
      return "invite_failed";
    }

    const { error: insertProfileError } = await admin
      .from("profiles")
      .insert({
        id: created.user.id,
        role: "teacher",
        teacher_id: teacher.id,
        student_id: null,
        line_user_id: lineUserId,
      });

    if (insertProfileError) {
      console.error(insertProfileError);
      await admin.auth.admin.deleteUser(created.user.id);
      return "invite_failed";
    }
  }

  /*
   * 邀請用過即失效
   */
  const { error: updateTeacherError } = await admin
    .from("teachers")
    .update({
      invite_status: "active",
      invite_token_hash: null,
      invite_expires_at: null,
    })
    .eq("id", teacher.id);

  if (updateTeacherError) {
    console.error(updateTeacherError);
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
    const bindError = await bindTeacherInvite(
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
    .select("id, role, teacher_id")
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

  /*
   * 3. 建立 Supabase session
   *
   * 產生 magic link token（不寄信），
   * 直接在伺服器端 verify，session 會寫進 cookie。
   */
  const { data: authUser, error: authUserError } =
    await admin.auth.admin.getUserById(profile.id);

  if (authUserError || !authUser.user?.email) {
    console.error(authUserError);
    return redirectToLogin(request, "login_failed");
  }

  const { data: link, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: authUser.user.email,
    });

  if (linkError || !link.properties?.hashed_token) {
    console.error(linkError);
    return redirectToLogin(request, "login_failed");
  }

  const supabase = await createClient();

  const { error: verifyError } =
    await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: link.properties.hashed_token,
    });

  if (verifyError) {
    console.error(verifyError);
    return redirectToLogin(request, "login_failed");
  }

  const home =
    profile.role === "admin"
      ? "/"
      : profile.role === "teacher"
        ? "/teacher"
        : "/unauthorized";

  return NextResponse.redirect(new URL(home, request.url));
}
