import { redirect } from "next/navigation";
import { isDevLoginEnabled } from "@/lib/devLogin";
import BrandScreen, { BrandCard, LineButton } from "@/components/BrandScreen";
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
    <BrandScreen>
      <BrandCard>
        <h1 className="text-center text-lg font-medium">工作室管理系統</h1>

        <p className="mt-1 text-center text-sm text-muted">
          老師、學生與工作室夥伴請用 LINE 登入
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            <p>{errorMessage}</p>

            {error === "not_bound" && lineUserId && (
              <p className="mt-2 break-all text-xs opacity-75">
                LINE User ID：{lineUserId}
              </p>
            )}
          </div>
        )}

        <div className="mt-6">
          <LineButton href="/auth/line">使用 LINE 登入</LineButton>
        </div>

        {isDevLoginEnabled() && (
          <a
            href="/dev/login"
            className="mt-4 block text-center text-xs text-warning underline"
          >
            開發用：切換身份登入
          </a>
        )}
      </BrandCard>
    </BrandScreen>
  );
}
