import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "沒有管理員權限" }, { status: 403 });
  }

  const body = await request.json();

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();

  const teacherShare = Number(body.teacherShare);

  if (!name || !email) {
    return NextResponse.json({ error: "姓名與 Email 為必填" }, { status: 400 });
  }

  if (Number.isNaN(teacherShare) || teacherShare < 0 || teacherShare > 1) {
    return NextResponse.json(
      { error: "老師抽成比例必須介於 0 到 1" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return NextResponse.json(
      {
        error: "伺服器缺少 NEXT_PUBLIC_SITE_URL 設定",
      },
      { status: 500 },
    );
  }

  /*
   * 先建立老師資料
   */
  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .insert({
      name,
      email,
      teacher_share: teacherShare,
      active: true,
    })
    .select("id, name, email, teacher_share, active")
    .single();

  if (teacherError || !teacher) {
    return NextResponse.json(
      {
        error: teacherError?.message ?? "建立老師資料失敗",
      },
      { status: 400 },
    );
  }

  /*
   * 寄 Supabase 邀請信
   */
  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        name,
        role: "teacher",
      },
      redirectTo: `${siteUrl}/auth/set-password`,
    });

  if (inviteError || !inviteData.user) {
    // Invite 失敗就把剛建立的 teacher rollback
    await supabase.from("teachers").delete().eq("id", teacher.id);

    const message = inviteError?.message ?? "寄送邀請失敗";

    if (message.toLowerCase().includes("rate limit")) {
      return NextResponse.json(
        {
          error: "邀請信寄送次數已達上限，請稍後再試。",
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
   * 建立 profile，連到 teacher
   */
  const { error: profileError } = await admin.from("profiles").insert({
    id: inviteData.user.id,
    role: "teacher",
    teacher_id: teacher.id,
    student_id: null,
  });

  if (profileError) {
    /*
     * 避免留下一半完成的資料
     */
    await admin.auth.admin.deleteUser(inviteData.user.id);

    await supabase.from("teachers").delete().eq("id", teacher.id);

    return NextResponse.json(
      {
        error: "建立老師登入身份失敗：" + profileError.message,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    teacher,
  });
}
