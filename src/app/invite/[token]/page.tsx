import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { findInvite } from "@/lib/invite";

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
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
        <div className="w-full max-w-md rounded-2xl border border-red-900 bg-zinc-900 p-8 text-center">
          <p className="text-sm text-zinc-500">Argo</p>

          <h1 className="mt-2 text-2xl font-bold">邀請連結無效</h1>

          <p className="mt-3 text-sm leading-6 text-zinc-400">
            這個邀請連結已使用、已過期或不存在。
            <br />
            請向管理員索取新的邀請連結。
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <p className="text-sm text-zinc-500">Argo</p>

        <h1 className="mt-2 text-2xl font-bold">
          {invite.kind === "teacher"
            ? `${invite.name} 老師，歡迎加入`
            : `${invite.name}，歡迎使用 Argo`}
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          請用你的 LINE 帳號完成綁定，之後就可以直接用 LINE 登入 Argo
          {invite.kind === "student" &&
            "，查看課表、剩餘堂數與上課紀錄"}
          。
        </p>

        <a
          href={`/auth/line?invite=${encodeURIComponent(token)}`}
          className="mt-6 block w-full rounded-xl bg-[#06C755] px-4 py-3 text-center font-medium text-white hover:bg-[#05b34c]"
        >
          使用 LINE 綁定並登入
        </a>
      </div>
    </main>
  );
}
