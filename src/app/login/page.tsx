import { redirect } from "next/navigation";
import { isDevLoginEnabled } from "@/lib/devLogin";
import { homeForRole } from "@/lib/authSession";
import { createClient } from "@/lib/supabase/server";

const ERROR_MESSAGES: Record<string, string> = {
  line_cancelled: "已取消 LINE 登入",
  line_state: "登入逾時或連線異常，請重新登入",
  line_failed: "LINE 驗證失敗，請重新登入",
  login_failed: "登入失敗，請稍後再試",
  not_bound: "這個 LINE 帳號尚未綁定 Argo，請向管理員索取邀請連結",
  invite_invalid: "邀請連結無效或已過期，請向管理員索取新的連結",
  invite_failed: "綁定 LINE 失敗，請稍後再試或聯絡管理員",
  line_already_bound: "這個 LINE 帳號已綁定其他使用者",
  teacher_inactive: "這個老師帳號已停用",
  student_inactive: "這個學生帳號已停用",
};

type Props = {
  searchParams: Promise<{
    error?: string;
    line_user_id?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { error, line_user_id: lineUserId } = await searchParams;

  /*
   * 已經登入（而且有身份）就直接進入系統
   */
  if (!error) {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        redirect(homeForRole(profile.role));
      }
    }
  }

  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "登入失敗")
    : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h1 className="mb-2 text-3xl font-bold">Argo</h1>

        <p className="mb-6 text-sm text-zinc-500">工作室管理系統登入</p>

        <div className="space-y-4">
          {errorMessage && (
            <div className="text-sm text-red-400">
              <p>{errorMessage}</p>

              {error === "not_bound" && lineUserId && (
                <p className="mt-2 break-all text-xs text-zinc-500">
                  LINE User ID：{lineUserId}
                </p>
              )}
            </div>
          )}

          <a
            href="/auth/line"
            className="block w-full rounded-xl bg-[#06C755] px-4 py-3 text-center font-medium text-white hover:bg-[#05b34c]"
          >
            使用 LINE 登入
          </a>

          {isDevLoginEnabled() && (
            <a
              href="/dev/login"
              className="block text-center text-xs text-amber-300 underline"
            >
              開發用：切換身份登入
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
