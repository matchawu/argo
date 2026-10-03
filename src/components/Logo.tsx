/*
 * Argo 字標
 *
 * 暫代版本：用文字模仿 logo 的字標（粗體、全大寫、很寬的字距）。
 * 拿到正式 logo（SVG，黑 / 白兩版）後只要換掉這個元件，全站一起更新。
 */
type Props = {
  size?: "sm" | "md" | "lg";
  /** 顯示「MUSIC STUDIO」副標 */
  withTagline?: boolean;
  className?: string;
};

const sizeClassName = {
  sm: "text-lg tracking-[0.32em]",
  md: "text-2xl tracking-[0.34em]",
  lg: "text-4xl tracking-[0.36em]",
};

const taglineClassName = {
  sm: "text-[0.6rem] tracking-[0.42em]",
  md: "text-xs tracking-[0.42em]",
  lg: "text-sm tracking-[0.45em]",
};

export default function Logo({
  size = "md",
  withTagline = false,
  className = "",
}: Props) {
  return (
    <span
      className={`inline-flex flex-col items-center font-display font-bold uppercase leading-none text-foreground ${className}`}
    >
      {/* 字距會在最後一個字後面多留空白，用負 margin 抵銷，讓字標真正置中 */}
      <span className={`${sizeClassName[size]} -mr-[0.34em]`}>Argo</span>

      {withTagline && (
        <span
          className={`mt-2 font-semibold ${taglineClassName[size]} -mr-[0.42em]`}
        >
          Music Studio
        </span>
      )}
    </span>
  );
}
