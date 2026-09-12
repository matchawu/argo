"use client";

import Link from "next/link";
import { useState } from "react";

type Lesson = {
  id: number;
  teacher: string;
  price: number;
  teacher_share: number | null;
  lesson_date: string;
  course: string;
  student: string;
};

type Props = {
  lessons: Lesson[];
  selectedMonth: string;
};

type TeacherSettlement = {
  teacher: string;
  lessonCount: number;
  totalRevenue: number;
  teacherAmount: number;
  studioAmount: number;
  lessons: Lesson[];
};

function addMonths(monthString: string, amount: number) {
  const [year, month] = monthString.split("-").map(Number);

  const date = new Date(year, month - 1 + amount, 1);

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");

  return `${nextYear}-${nextMonth}`;
}

export default function SettlementView({ lessons, selectedMonth }: Props) {
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);
  const settlements = lessons.reduce<Record<string, TeacherSettlement>>(
    (result, lesson) => {
      const share = lesson.teacher_share ?? 0;

      if (!result[lesson.teacher]) {
        result[lesson.teacher] = {
          teacher: lesson.teacher,
          lessonCount: 0,
          totalRevenue: 0,
          teacherAmount: 0,
          studioAmount: 0,
          lessons: [],
        };
      }

      const teacherAmount = lesson.price * share;

      const studioAmount = lesson.price - teacherAmount;

      result[lesson.teacher].lessonCount += 1;

      result[lesson.teacher].totalRevenue += lesson.price;

      result[lesson.teacher].teacherAmount += teacherAmount;

      result[lesson.teacher].studioAmount += studioAmount;

      result[lesson.teacher].lessons.push(lesson);

      return result;
    },
    {},
  );

  const rows = Object.values(settlements);

  const totalRevenue = rows.reduce((sum, row) => sum + row.totalRevenue, 0);

  const totalTeacherAmount = rows.reduce(
    (sum, row) => sum + row.teacherAmount,
    0,
  );

  const totalStudioAmount = rows.reduce(
    (sum, row) => sum + row.studioAmount,
    0,
  );

  const previousMonth = addMonths(selectedMonth, -1);

  const nextMonth = addMonths(selectedMonth, 1);

  function exportCsv() {
    const header = [
      "日期",
      "老師",
      "學生",
      "課程",
      "學費",
      "老師比例",
      "老師應得",
      "工作室應得",
    ];

    const rows = lessons.map((lesson) => {
      const share = lesson.teacher_share ?? 0;
      const teacherAmount = Math.round(lesson.price * share);
      const studioAmount = lesson.price - teacherAmount;

      return [
        lesson.lesson_date,
        lesson.teacher,
        lesson.student,
        lesson.course,
        lesson.price,
        share,
        teacherAmount,
        studioAmount,
      ];
    });

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `argo-settlement-${selectedMonth}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">月結報表</h1>

            <p className="mt-2 text-zinc-500">
              {selectedMonth.replace("-", " / ")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/settlement?month=${previousMonth}`}
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              ← 上個月
            </Link>

            <Link
              href="/settlement"
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              本月
            </Link>

            <Link
              href={`/settlement?month=${nextMonth}`}
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              下個月 →
            </Link>

            <button
              onClick={exportCsv}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
            >
              匯出 CSV
            </button>
          </div>
        </div>

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          <StatCard
            title="總學費"
            value={`$${totalRevenue.toLocaleString()}`}
          />

          <StatCard
            title="老師分潤"
            value={`$${Math.round(totalTeacherAmount).toLocaleString()}`}
          />

          <StatCard
            title="工作室收入"
            value={`$${Math.round(totalStudioAmount).toLocaleString()}`}
          />
        </section>

        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <div className="grid grid-cols-5 bg-zinc-900 px-5 py-3 text-sm text-zinc-500">
            <div>老師</div>
            <div>完成堂數</div>
            <div>總學費</div>
            <div>老師應得</div>
            <div>工作室應得</div>
          </div>

          {rows.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              這個月還沒有已完成課程
            </div>
          ) : (
            rows.map((row) => (
              <div key={row.teacher} className="border-t border-zinc-800">
                <button
                  onClick={() =>
                    setExpandedTeacher(
                      expandedTeacher === row.teacher ? null : row.teacher,
                    )
                  }
                  className="grid w-full grid-cols-5 px-5 py-4 text-left hover:bg-zinc-900"
                >
                  <div className="font-medium">{row.teacher}</div>

                  <div>{row.lessonCount}</div>

                  <div>${row.totalRevenue.toLocaleString()}</div>

                  <div>${Math.round(row.teacherAmount).toLocaleString()}</div>

                  <div className="flex items-center justify-between">
                    <span>
                      ${Math.round(row.studioAmount).toLocaleString()}
                    </span>

                    <span className="text-zinc-500">
                      {expandedTeacher === row.teacher ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {expandedTeacher === row.teacher && (
                  <div className="bg-zinc-950 px-5 py-4">
                    <div className="mb-3 text-sm font-medium text-zinc-400">
                      本月課程明細
                    </div>

                    <div className="space-y-2">
                      {row.lessons.map((lesson) => {
                        const share = lesson.teacher_share ?? 0;

                        const teacherAmount = lesson.price * share;

                        const studioAmount = lesson.price - teacherAmount;

                        return (
                          <div
                            key={lesson.id}
                            className="grid grid-cols-[120px_1fr_120px_120px_120px] gap-4 rounded-xl bg-zinc-900 px-4 py-3 text-sm"
                          >
                            <div className="text-zinc-400">
                              {lesson.lesson_date}
                            </div>

                            <div>
                              <div>{lesson.student}</div>

                              <div className="text-zinc-500">
                                {lesson.course}
                              </div>
                            </div>

                            <div>${lesson.price.toLocaleString()}</div>

                            <div>
                              ${Math.round(teacherAmount).toLocaleString()}
                            </div>

                            <div>
                              ${Math.round(studioAmount).toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-500">{title}</p>

      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
