export type Enrollment = {
  id: number;
  student_id: number;
  teacher_id: number;
  course: string;
  price: number;
  default_weekday: number;
  default_time: string;
  start_date: string;
  end_date: string | null;

  students: {
    name: string;
  };

  teachers: {
    name: string;
    teacher_share: number;
  };
};