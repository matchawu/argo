import { createClient } from "@/lib/supabase/client";
import {
  parseLocalDate,
  formatLocalDate,
} from "@/lib/date";
import type { Enrollment } from "@/types/enrollment";

export async function generateLessonsForEnrollment(
  enrollment: Enrollment,
  numberOfWeeks = 4,
) {
  
  const supabase = createClient();

  const startDate = parseLocalDate(enrollment.start_date);

  const dates: string[] = [];

  const firstLessonDate = new Date(startDate);

  const currentWeekday = firstLessonDate.getDay();
  const targetWeekday = enrollment.default_weekday;

  let daysToAdd = targetWeekday - currentWeekday;

  if (daysToAdd < 0) {
    daysToAdd += 7;
  }

  firstLessonDate.setDate(firstLessonDate.getDate() + daysToAdd);

  for (let i = 0; i < numberOfWeeks; i++) {
    const lessonDate = new Date(firstLessonDate);

    lessonDate.setDate(firstLessonDate.getDate() + i * 7);

    const dateString = formatLocalDate(lessonDate);

    if (enrollment.end_date && dateString > enrollment.end_date) {
      break;
    }

    dates.push(dateString);
  }

  const lessonsToInsert = dates.map((date) => ({
    enrollment_id: enrollment.id,
    student: enrollment.students.name,
    teacher: enrollment.teachers.name,
    course: enrollment.course,
    lesson_date: date,
    lesson_time: enrollment.default_time,
    price: enrollment.price,
    teacher_share: enrollment.teachers.teacher_share,
    status: "scheduled",
  }));

  const { data, error } = await supabase
    .from("lessons")
    .upsert(lessonsToInsert, {
      onConflict: "enrollment_id,lesson_date",
      ignoreDuplicates: true,
    })
    .select();

  if (error) {
    throw error;
  }

  return data;
}
