import Dashboard from "@/components/Dashboard";
import { supabase } from "@/lib/supabase";
import type { Lesson } from "@/types/lesson";

type Props = {
  searchParams: Promise<{
    date?: string;
  }>;
};

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default async function Home({
  searchParams,
}: Props) {
  const params = await searchParams;

  const selectedDate =
    params.date ?? formatLocalDate(new Date());

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
    student: lesson.student,
    teacher: lesson.teacher,
    course: lesson.course,
    date: lesson.lesson_date,
    time: lesson.lesson_time.slice(0, 5),
    price: lesson.price,
    status: lesson.status,
  }));

  return (
    <Dashboard
      initialLessons={lessons}
      selectedDate={selectedDate}
    />
  );
}