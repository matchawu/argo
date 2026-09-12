export type LessonStatus =
  | "scheduled"
  | "completed"
  | "cancelled";

export type Lesson = {
  id: number;

  studentId?: number | null;
  teacherId?: number | null;
  teacherShare?: number | null;

  student: string;
  teacher: string;

  course: string;
  date: string;
  time: string;
  price: number;
  status: LessonStatus;
};