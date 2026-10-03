import {
  enrollmentLabel,
  type LessonBalance,
} from "@/lib/lessonBalance";

type Props = {
  balance: LessonBalance;
};

/*
 * 剩餘堂數的顏色：正常時跟一般文字一樣（黑白），
 * 快用完 / 用完才用狀態色提醒。
 */
export function remainingClassName(remaining: number) {
  return remaining <= 0
    ? "text-danger"
    : remaining <= 2
      ? "text-warning"
      : "text-foreground";
}

export default function LessonBalanceCards({ balance }: Props) {
  if (balance.enrollments.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-dashed border-line-strong p-10 text-center text-sm text-muted">
        目前沒有固定課程
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {balance.enrollments.map((enrollment) => (
        <section
          key={enrollment.enrollmentId}
          className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium">{enrollmentLabel(enrollment)}</h2>

            <span className="rounded-full bg-fill px-2.5 py-0.5 text-xs text-muted">
              {enrollment.intervalWeeks === 2 ? "隔週" : "每週"}
            </span>

            {!enrollment.active && (
              <span className="rounded-full bg-fill px-2.5 py-0.5 text-xs text-subtle">
                已停課
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-y-5 sm:grid-cols-4">
            <Stat
              title="剩餘堂數"
              value={enrollment.remaining}
              valueClassName={remainingClassName(enrollment.remaining)}
            />

            <Stat title="已購買" value={enrollment.purchased} />

            <Stat title="已上課" value={enrollment.used} />

            <Stat title="已排課待上" value={enrollment.scheduled} />
          </div>
        </section>
      ))}
    </div>
  );
}

function Stat({
  title,
  value,
  valueClassName = "text-foreground",
}: {
  title: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{title}</p>

      <p
        className={`mt-1 font-display text-4xl font-bold leading-none ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}
