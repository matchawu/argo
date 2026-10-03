import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-sm text-muted">
          Argo
        </p>

        <h1 className="mt-2 text-2xl font-bold">
          尚未開放此入口
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted">
          你的帳號已登入，但目前沒有後台管理權限。
        </p>

        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
        >
          返回登入頁
        </Link>
      </div>
    </main>
  );
}