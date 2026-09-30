-- 老闆也是老師：admin 可以同時對應一位老師（teacher_id）
--
-- 原本的 profile_role_link_check 不允許 admin 有 teacher_id。
-- 如果要看原本的定義：
--   select pg_get_constraintdef(oid) from pg_constraint
--   where conname = 'profile_role_link_check';

alter table public.profiles
  drop constraint if exists profile_role_link_check;

alter table public.profiles
  add constraint profile_role_link_check check (
    (role = 'admin' and student_id is null)
    or (role = 'teacher' and teacher_id is not null and student_id is null)
    or (role = 'student' and student_id is not null and teacher_id is null)
  );
