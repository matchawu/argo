export type LessonStatus =
  | "scheduled"
  | "completed"
  | "cancelled";

export type Lesson = {
  id: number;
  student: string;
  teacher: string;
  course: string;
  date: string;
  time: string;
  price: number;
  status: LessonStatus;
};