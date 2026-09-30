import {
  enrollmentLabel,
  type LessonBalance,
} from "@/lib/lessonBalance";

type Props = {
  balance: LessonBalance;
};

export function remainingClassName(remaining: number) {
  return remaining <= 0
    ? "text-red-400"
    : remaining <= 2
      ? "text-amber-300"
      : "text-emerald-300";
}

export default function LessonBalanceCards({ balance }: Props) {
  if (balance.enrollments.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 p-10 text-center text-sm text-zinc-500">
        目前沒有固定課程
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {balance.enrollments.map((enrollment) => (
        <section key={enrollment.enrollmentId}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">
              {enrollmentLabel(enrollment)}
            </h2>

            <span className="text-sm text-zinc-500">
              {enrollment.intervalWeeks === 2 ? "隔週" : "每週"}
            </span>

            {!enrollment.active && (
              <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-500">
                已停課
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard title="已購買" value={enrollment.purchased} />

            <StatCard title="已上課" value={enrollment.used} />

            <StatCard
              title="剩餘堂數"
              value={enrollment.remaining}
              highlight={remainingClassName(enrollment.remaining)}
            />

            <StatCard title="已排課待上" value={enrollment.scheduled} />
          </div>
        </section>
      ))}
    </div>
  );
}

function StatCard({
  title,
  value,
  highlight,
}: {
  title: string;
  value: number;
  highlight?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-500">{title}</p>

      <p className={`mt-2 text-3xl font-semibold ${highlight ?? ""}`}>
        {value}
      </p>
    </div>
  );
}
