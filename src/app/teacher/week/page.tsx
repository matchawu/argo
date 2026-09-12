import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TeacherWeekView from "@/components/TeacherWeekView";
import {
  addDays,
  formatLocalDate,
  parseLocalDate,
  getTodayInTaiwan
} from "@/lib/date";

export const metadata: Metadata = {
  title: "我的本週課表",
};

type Props = {
  searchParams: Promise<{
    date?: string;
  }>;
};

function getMonday(date: Date) {
  const result = new Date(date);

  const day = result.getDay();

  const diff =
    day === 0 ? -6 : 1 - day;

  result.setDate(
    result.getDate() + diff,
  );

  return result;
}

export default async function TeacherWeekPage({
  searchParams,
}: Props) {
  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role, teacher_id")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "teacher" ||
    !profile.teacher_id
  ) {
    redirect("/");
  }

  const params =
    await searchParams;

  const selectedDate =
    params.date ??
    getTodayInTaiwan();

  const monday = getMonday(
    parseLocalDate(selectedDate),
  );

  const startDate =
    formatLocalDate(monday);

  const endDate =
    addDays(startDate, 6);

  const {
    data: lessons,
    error,
  } = await supabase
    .from("lessons")
    .select(`
      id,
      student,
      course,
      lesson_date,
      lesson_time,
      status
    `)
    .eq(
      "teacher_id",
      profile.teacher_id,
    )
    .gte(
      "lesson_date",
      startDate,
    )
    .lte(
      "lesson_date",
      endDate,
    )
    .order("lesson_date", {
      ascending: true,
    })
    .order("lesson_time", {
      ascending: true,
    });

  if (error) {
    return (
      <main className="p-10 text-zinc-100">
        <h1>
          讀取本週課程失敗
        </h1>

        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <TeacherWeekView
      lessons={(lessons ?? []).map(
        (lesson) => ({
          id: lesson.id,
          student: lesson.student,
          course: lesson.course,
          date: lesson.lesson_date,
          time: lesson.lesson_time.slice(
            0,
            5,
          ),
          status: lesson.status,
        }),
      )}
      startDate={startDate}
      endDate={endDate}
    />
  );
}