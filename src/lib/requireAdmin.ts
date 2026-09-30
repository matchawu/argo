import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/*
 * API route 用：確認目前登入者是 admin。
 *
 * 不是 admin 時回傳 { denied }，是 admin 時回傳 { userId }。
 */
export async function getAdminUser(): Promise<
  { denied: NextResponse; userId?: never } | { denied?: never; userId: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      denied: NextResponse.json(
        { error: "未登入" },
        { status: 401 },
      ),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return {
      denied: NextResponse.json(
        { error: "沒有管理員權限" },
        { status: 403 },
      ),
    };
  }

  return { userId: user.id };
}

/*
 * 只需要確認權限時使用。
 *
 * 不是 admin 時回傳錯誤 response，是 admin 時回傳 null。
 */
export async function requireAdminApi() {
  const { denied } = await getAdminUser();

  return denied ?? null;
}
