import { supabase } from "@/lib/supabase";
import type { Lesson } from "@/types/lesson";
import WeekView from "@/components/WeekView";
import {
  addDays,
  formatLocalDate,
  parseLocalDate,
} from "@/lib/date";

function getMonday(date: Date) {
  const result = new Date(date);

  const day = result.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);

  return result;
}

type Props = {
  searchParams: Promise<{
    date?: string;
  }>;
};

export default async function WeekPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const selectedDate =
    params.date ?? formatLocalDate(new Date());

  const monday = getMonday(
    parseLocalDate(selectedDate)
  );

  const startDate = formatLocalDate(monday);
  const endDate = addDays(startDate, 6);

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .gte("lesson_date", startDate)
    .lte("lesson_date", endDate)
    .order("lesson_date", {
      ascending: true,
    })
    .order("lesson_time", {
      ascending: true,
    });

  if (error) {
    return (
      <main className="p-10">
        <h1>讀取本週課程失敗</h1>
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
    <WeekView
      lessons={lessons}
      startDate={startDate}
      endDate={endDate}
    />
  );
}