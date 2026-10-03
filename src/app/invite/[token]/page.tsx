import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { findInvite } from "@/lib/invite";
import BrandScreen, { BrandCard, LineButton } from "@/components/BrandScreen";

export const metadata: Metadata = {
  title: "邀請",
};

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  const invite = await findInvite(createAdminClient(), token);

  if (!invite || !invite.active) {
    return (
      <BrandScreen>
        <BrandCard tone="danger">
          <h1 className="text-center text-lg font-medium">邀請連結無效</h1>

          <p className="mt-3 text-center text-sm leading-6 text-muted">
            這個邀請連結已使用、已過期或不存在。
            <br />
            請向工作室索取新的邀請連結。
          </p>
        </BrandCard>
      </BrandScreen>
    );
  }

  return (
    <BrandScreen>
      <BrandCard>
        <p className="text-center font-display text-xs font-semibold uppercase tracking-[0.25em] text-subtle">
          {invite.kind === "teacher" ? "Teacher Invitation" : "Welcome"}
        </p>

        <h1 className="mt-3 text-center text-xl font-medium">
          {invite.kind === "teacher"
            ? `${invite.name} 老師，歡迎加入`
            : `${invite.name}，歡迎你`}
        </h1>

        <p className="mt-3 text-center text-sm leading-6 text-muted">
          用 LINE 完成綁定後，之後就能直接用 LINE 登入
          {invite.kind === "student"
            ? "，查看課表、剩餘堂數與上課紀錄。"
            : "，查看課表、簽到與撰寫教學紀錄。"}
        </p>

        <div className="mt-7">
          <LineButton href={`/auth/line?invite=${encodeURIComponent(token)}`}>
            使用 LINE 綁定並登入
          </LineButton>
        </div>
      </BrandCard>
    </BrandScreen>
  );
}
