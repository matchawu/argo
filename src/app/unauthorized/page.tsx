import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <p className="text-sm text-zinc-500">
          Argo
        </p>

        <h1 className="mt-2 text-2xl font-bold">
          尚未開放此入口
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-400">
          你的帳號已登入，但目前沒有後台管理權限。
        </p>

        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
        >
          返回登入頁
        </Link>
      </div>
    </main>
  );
}