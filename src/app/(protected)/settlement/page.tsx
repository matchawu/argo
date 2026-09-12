import type { Metadata } from "next";
import SettlementView from "@/components/SettlementView";
import { createClient } from "@/lib/supabase/server";
import { formatLocalDate, getTodayInTaiwan } from "@/lib/date";

export const metadata: Metadata = {
  title: "月結",
};

type Props = {
  searchParams: Promise<{
    month?: string;
  }>;
};

function getCurrentMonth() {
  return getTodayInTaiwan().slice(0, 7);
}

function getMonthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);

  const start = `${year}-${String(monthNumber).padStart(2, "0")}-01`;

  const nextMonth =
    monthNumber === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(monthNumber + 1).padStart(2, "0")}-01`;

  return {
    start,
    nextMonth,
  };
}

export default async function SettlementPage({
  searchParams,
}: Props) {
  const supabase = await createClient();

  const params = await searchParams;

  const selectedMonth =
    params.month ?? getCurrentMonth();

  const { start, nextMonth } =
    getMonthRange(selectedMonth);

  const { data, error } = await supabase
    .from("lessons")
    .select(`
      id,
      student_id,
      teacher_id,
      student,
      teacher,
      price,
      teacher_share,
      lesson_date,
      course
    `)
    .eq("status", "completed")
    .gte("lesson_date", start)
    .lt("lesson_date", nextMonth)
    .order("lesson_date", {
      ascending: true,
    });

  if (error) {
    return (
      <main className="p-10">
        <h1>讀取月結資料失敗</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <SettlementView
      lessons={data ?? []}
      selectedMonth={selectedMonth}
    />
  );
}