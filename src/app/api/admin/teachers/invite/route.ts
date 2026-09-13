import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
   * 1. 建立老師
   *
   * 此時永遠先是 not_invited。
   */
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
      invite_status: "not_invited",
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

  /*
   * 2. 建立 Auth user + 寄邀請
   */
  const {
    data: inviteData,
    error: inviteError,
  } =
    await admin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name,
          role: "teacher",
        },
        redirectTo: `${siteUrl}/auth/set-password`,
      },
    );

  /*
   * 3. Invite 失敗
   *
   * teacher 保留。
   * 狀態維持 not_invited。
   */
  if (
    inviteError ||
    !inviteData.user
  ) {
    /*
     * 理論上 invite 失敗通常不會留下
     * 可用的 Auth user。
     *
     * 但如果 API 回傳了 user，
     * 還是做一次清理，避免半套帳號。
     */
    if (inviteData?.user?.id) {
      const { error: cleanupError } =
        await admin.auth.admin.deleteUser(
          inviteData.user.id,
        );

      if (cleanupError) {
        console.error(
          "Failed to clean up auth user:",
          cleanupError,
        );

        return NextResponse.json(
          {
            error:
              "邀請失敗，而且登入帳號清理失敗，請檢查 Supabase Authentication。",
          },
          { status: 500 },
        );
      }
    }

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
            "老師已建立，但邀請信寄送次數已達上限。之後可以從老師管理重新寄送。",
          teacher,
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error:
          `老師已建立，但邀請尚未寄出：${message}`,
        teacher,
      },
      { status: 400 },
    );
  }

  /*
   * 4. 建立 profile
   */
  const { error: profileError } =
    await admin
      .from("profiles")
      .insert({
        id: inviteData.user.id,
        role: "teacher",
        teacher_id: teacher.id,
        student_id: null,
      });

  /*
   * profile 建立失敗
   *
   * 把 Auth user 清掉，
   * teacher 留著維持 not_invited。
   */
  if (profileError) {
    const { error: cleanupError } =
      await admin.auth.admin.deleteUser(
        inviteData.user.id,
      );

    if (cleanupError) {
      console.error(
        "Failed to clean up auth user:",
        cleanupError,
      );

      return NextResponse.json(
        {
          error:
            "登入身份建立不完整，而且清理失敗，請檢查 Supabase Authentication 與 profiles。",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error:
          "老師已建立，但登入身份建立失敗。可以稍後重新寄送邀請。",
        teacher,
      },
      { status: 400 },
    );
  }

  /*
   * 5. Auth user + profile 都成功
   *
   * 才正式把 teacher 標記成 invited。
   */
  const {
    data: updatedTeacher,
    error: updateTeacherError,
  } = await admin
    .from("teachers")
    .update({
      invite_status: "invited",
      invited_at:
        new Date().toISOString(),
    })
    .eq("id", teacher.id)
    .select(
      "id, name, email, teacher_share, active, invite_status, invited_at",
    )
    .single();

  /*
   * 如果最後狀態更新失敗，
   * 也不要留下 Auth/Profile 半套資料。
   */
  if (
    updateTeacherError ||
    !updatedTeacher
  ) {
    const { error: cleanupError } =
      await admin.auth.admin.deleteUser(
        inviteData.user.id,
      );

    if (cleanupError) {
      console.error(
        "Failed to rollback auth user:",
        cleanupError,
      );

      return NextResponse.json(
        {
          error:
            "老師登入帳號已建立，但邀請狀態更新失敗，而且自動清理也失敗。請檢查 Supabase。",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error:
          "老師已建立，但邀請流程未完整完成。可以稍後重新寄送邀請。",
        teacher,
      },
      { status: 500 },
    );
  }

  /*
   * 完整成功 🎉
   */
  return NextResponse.json({
    teacher: updatedTeacher,
  });
}