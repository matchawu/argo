-- 一次性：刪除 10/1 以前的測試資料（只執行一次）
--
-- 假資料：老師 #1～4、學生 #1～5
-- 保留：老師 #9（克銓）、學生 #6～19、admin
--
-- 整段在同一個 transaction 裡；任何一步出錯（例如還有其他資料表參照到這些老師 / 學生），
-- 全部會自動復原，什麼都不會被刪。

begin;

create temporary table mock_teachers (id bigint) on commit drop;
create temporary table mock_students (id bigint) on commit drop;

insert into mock_teachers values (1), (2), (3), (4);
insert into mock_students values (1), (2), (3), (4), (5);

-- 安全檢查：真實老師 / 學生不能和假資料混在同一堂課或同一筆固定課程
do $$
begin
  if exists (
    select 1 from public.lessons
    where (student_id in (select id from mock_students))
       <> (teacher_id in (select id from mock_teachers))
  ) or exists (
    select 1 from public.enrollments
    where (student_id in (select id from mock_students))
       <> (teacher_id in (select id from mock_teachers))
  ) then
    raise exception '有課程同時包含真實與測試的老師 / 學生，已中止，請先檢查資料';
  end if;
end;
$$;

-- 要一起刪掉的登入帳號
create temporary table mock_users on commit drop as
select id from public.profiles
where teacher_id in (select id from mock_teachers)
   or student_id in (select id from mock_students);

delete from public.payments
where student_id in (select id from mock_students);

delete from public.lessons
where student_id in (select id from mock_students)
   or teacher_id in (select id from mock_teachers);

delete from public.teacher_student_notes
where student_id in (select id from mock_students)
   or teacher_id in (select id from mock_teachers);

delete from public.enrollments
where student_id in (select id from mock_students)
   or teacher_id in (select id from mock_teachers);

delete from public.profiles
where id in (select id from mock_users);

delete from auth.users
where id in (select id from mock_users);

delete from public.students
where id in (select id from mock_students);

delete from public.teachers
where id in (select id from mock_teachers);

-- 確認結果：應該只剩真實資料
select 'teachers' as table_name, count(*) from public.teachers
union all select 'students', count(*) from public.students
union all select 'enrollments', count(*) from public.enrollments
union all select 'lessons', count(*) from public.lessons
union all select 'lessons before 10/1', count(*) from public.lessons where lesson_date < '2026-10-01'
union all select 'payments', count(*) from public.payments
union all select 'profiles', count(*) from public.profiles;

commit;
