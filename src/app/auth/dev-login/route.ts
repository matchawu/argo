import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDevLoginEnabled } from "@/lib/devLogin";
import { studentAuthEmail } from "@/lib/invite";
import {
  createLoginProfile,
  homeForRole,
  signInAsUser,
} from "@/lib/authSession";

/*
 * 開發用登入
 *
 * /auth/dev-login?role=admin&id=<profile uuid>
 * /auth/dev-login?role=teacher&id=<teacher id>
 * /auth/dev-login?role=student&id=<student id>
 *
 * 老師 / 學生還沒有登入身份時會自動建立（不綁 LINE），
 * 之後用邀請連結綁 LINE 會沿用同一個身份。
 */
export async function GET(request: NextRequest) {
  if (!isDevLoginEnabled()) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const params = request.nextUrl.searchParams;
  const role = params.get("role");
  const id = params.get("id") ?? "";

  const admin = createAdminClient();

  const fail = (message: string) =>
    NextResponse.redirect(
      new URL(
        `/dev/login?error=${encodeURIComponent(message)}`,
        request.url,
      ),
    );

  let profileId: string | null = null;

  if (role === "admin") {
    profileId = id;
  } else if (role === "teacher" || role === "student") {
    const numericId = Number(id);
    const idColumn = role === "teacher" ? "teacher_id" : "student_id";

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("role", role)
      .eq(idColumn, numericId)
      .maybeSingle();

    profileId = profile?.id ?? null;

    if (!profileId) {
      const { data: record } = await admin
        .from(role === "teacher" ? "teachers" : "students")
        .select(role === "teacher" ? "id, name, email" : "id, name")
        .eq("id", numericId)
        .maybeSingle<{ id: number; name: string; email?: string | null }>();

      if (!record) {
        return fail("找不到這個身份");
      }

      const email =
        role === "teacher"
          ? record.email
          : studentAuthEmail(record.id);

      if (!email) {
        return fail("這位老師沒有 Email，無法建立登入身份");
      }

      profileId = await createLoginProfile(admin, {
        kind: role,
        id: record.id,
        name: record.name,
        email,
        lineUserId: null,
      });

      if (!profileId) {
        return fail("建立登入身份失敗，請看 terminal 錯誤訊息");
      }
    }
  } else {
    return fail("role 不正確");
  }

  if (!(await signInAsUser(admin, profileId))) {
    return fail("登入失敗，請看 terminal 錯誤訊息");
  }

  return NextResponse.redirect(
    new URL(homeForRole(role), request.url),
  );
}
