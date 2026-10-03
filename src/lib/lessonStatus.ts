import type { LessonStatus } from "@/types/lesson";

export const lessonStatusLabel: Record<LessonStatus, string> = {
  scheduled: "待上課",
  completed: "已完成",
  cancelled: "已取消",
};

export const lessonStatusClassName: Record<LessonStatus, string> = {
  scheduled: "bg-warning-soft text-warning",
  completed: "bg-success-soft text-success",
  cancelled: "bg-fill text-subtle",
};
