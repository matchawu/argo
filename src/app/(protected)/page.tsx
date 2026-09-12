import type { Metadata } from "next";
import Dashboard from "@/components/Dashboard";
import { createClient } from "@/lib/supabase/server";
import type { Lesson } from "@/types/lesson";
import { redirect } from "next/navigation";
import {
  addDays,
  formatLocalDate,
  parseLocalDate,
  getTodayInTaiwan,
} from "@/lib/date";

export const metadata: Metadata = {
  title: "今日課程",
};

type Props = {
  searchParams: Promise<{
    date?: string;
  }>;
};

export default async function Home({ searchParams }: Props) {
  const supabase = await createClient();

  const params = await searchParams;

  const selectedDate = params.date ?? getTodayInTaiwan();

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("lesson_date", selectedDate)
    .order("lesson_time", {
      ascending: true,
    });

  if (error) {
    return (
      <main className="p-10">
        <h1>讀取課程失敗</h1>
        <p>{error.message}</p>
      </main>
    );
  }

  const lessons: Lesson[] = data.map((lesson) => ({
    id: lesson.id,

    studentId: lesson.student_id,
    teacherId: lesson.teacher_id,
    teacherShare: lesson.teacher_share,

    student: lesson.student,
    teacher: lesson.teacher,

    course: lesson.course,
    date: lesson.lesson_date,
    time: lesson.lesson_time.slice(0, 5),
    price: lesson.price,
    status: lesson.status,
  }));

  return <Dashboard initialLessons={lessons} selectedDate={selectedDate} />;
}
