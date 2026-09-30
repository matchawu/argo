-- 單堂課（補課 / 加課）也歸屬某一筆固定課程，完成後扣該課程的堂數
--
-- is_extra = true：手動新增的單堂課
-- 產生固定課程時不把單堂課當成「這週已經有課」，避免少排一堂。
alter table public.lessons
  add column if not exists is_extra boolean not null default false;
