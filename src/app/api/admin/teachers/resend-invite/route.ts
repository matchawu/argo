import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .select(
      "id, name, email, teacher_share, active, invite_status, invited_at",
    )
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
   * 4. 看這位老師是否已經有 profile / Auth 帳號
   */
  const {
    data: teacherProfile,
    error: teacherProfileError,
  } = await admin
    .from("profiles")
    .select("id")
    .eq("teacher_id", teacher.id)
    .eq("role", "teacher")
    .maybeSingle();

  if (teacherProfileError) {
    return NextResponse.json(
      {
        error:
          "檢查老師登入身份失敗：" +
          teacherProfileError.message,
      },
      { status: 500 },
    );
  }

  /*
   * 5A. 已經有 Auth 帳號
   *
   * 不再 invite 同一個 email，
   * 改寄設定 / 重設密碼信。
   */
  if (teacherProfile) {
    const { error: resetError } =
      await admin.auth.resetPasswordForEmail(
        teacher.email,
        {
          redirectTo: `${siteUrl}/auth/set-password`,
        },
      );

    if (resetError) {
      const message = resetError.message;

      if (
        message
          .toLowerCase()
          .includes("rate limit")
      ) {
        return NextResponse.json(
          {
            error:
              "邀請信寄送次數已達上限，請稍後再試。",
          },
          { status: 429 },
        );
      }

      return NextResponse.json(
        {
          error:
            "重新寄送邀請失敗：" +
            message,
        },
        { status: 400 },
      );
    }

    const {
      data: updatedTeacher,
      error: updateError,
    } = await admin
      .from("teachers")
      .update({
        invite_status: "invited",
        invited_at: new Date().toISOString(),
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
    });
  }

  /*
   * 5B. 還沒有 Auth 帳號
   *
   * 真正建立 Supabase Auth user，
   * 並寄 invite。
   */
  const {
    data: inviteData,
    error: inviteError,
  } =
    await admin.auth.admin.inviteUserByEmail(
      teacher.email,
      {
        data: {
          name: teacher.name,
          role: "teacher",
        },
        redirectTo: `${siteUrl}/auth/set-password`,
      },
    );

  if (
    inviteError ||
    !inviteData.user
  ) {
    const message =
      inviteError?.message ??
      "寄送邀請失敗";

    if (
      message
        .toLowerCase()
        .includes("rate limit")
    ) {
      return NextResponse.json(
        {
          error:
            "邀請信寄送次數已達上限，請稍後再試。",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 },
    );
  }

  /*
   * 6. 建立 profile
   */
  const { error: profileInsertError } =
    await admin.from("profiles").insert({
      id: inviteData.user.id,
      role: "teacher",
      teacher_id: teacher.id,
      student_id: null,
    });

  if (profileInsertError) {
    await admin.auth.admin.deleteUser(
      inviteData.user.id,
    );

    return NextResponse.json(
      {
        error:
          "建立老師登入身份失敗：" +
          profileInsertError.message,
      },
      { status: 400 },
    );
  }

  /*
   * 7. 更新邀請狀態
   */
  const {
    data: updatedTeacher,
    error: updateError,
  } = await admin
    .from("teachers")
    .update({
      invite_status: "invited",
      invited_at: new Date().toISOString(),
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
  });
}