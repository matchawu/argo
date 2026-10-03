import Logo from "@/components/Logo";

/*
 * 登入 / 邀請頁共用版型
 *
 * 背景是跟官網、logo 一樣的「攝影棚」漸層：中間亮、四周偏灰。
 */
export default function BrandScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,var(--surface)_0%,var(--background)_55%,var(--fill-strong)_100%)] px-6 py-12">
      <Logo size="lg" withTagline />

      <div className="mt-12 w-full max-w-sm">{children}</div>
    </main>
  );
}

/*
 * 品牌頁上的卡片
 */
export function BrandCard({
  tone = "default",
  children,
}: {
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-3xl border bg-surface/80 p-7 shadow-card backdrop-blur ${
        tone === "danger" ? "border-danger/30" : "border-line"
      }`}
    >
      {children}
    </div>
  );
}

/*
 * LINE 按鈕：依 LINE 品牌規範使用 LINE 綠
 */
export function LineButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex h-12 w-full items-center justify-center rounded-full bg-[#06C755] font-medium text-white transition hover:bg-[#05b34c]"
    >
      {children}
    </a>
  );
}
