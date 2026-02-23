-- ─────────────────────────────────────────────────────────
-- Studio Chat Messages
-- Per-log-date two-way chat between teacher and student
-- ─────────────────────────────────────────────────────────

create table if not exists studio_chat_messages (
  id              uuid        default gen_random_uuid() primary key,
  studio_id       uuid        not null references teacher_studios(id) on delete cascade,
  student_user_id uuid        not null references auth.users(id) on delete cascade,
  log_date        date        not null,
  sender_role     text        not null check (sender_role in ('teacher', 'student')),
  message         text        not null,
  created_at      timestamptz default now()
);

create index if not exists idx_studio_chat_studio_student_date
  on studio_chat_messages (studio_id, student_user_id, log_date, created_at);

-- ── Row Level Security ──────────────────────────────────

alter table studio_chat_messages enable row level security;

-- Teachers can read all messages in their own studio
create policy "Teachers can read messages in their studio"
  on studio_chat_messages for select
  using (
    studio_id in (
      select id from teacher_studios where user_id = auth.uid()
    )
  );

-- Teachers can send messages (as 'teacher') in their own studio
create policy "Teachers can insert messages as teacher"
  on studio_chat_messages for insert
  with check (
    studio_id in (
      select id from teacher_studios where user_id = auth.uid()
    )
    and sender_role = 'teacher'
  );

-- Students can read their own chat messages
create policy "Students can read their own messages"
  on studio_chat_messages for select
  using (student_user_id = auth.uid());

-- Students can send messages (as 'student') in their studio
create policy "Students can insert messages as student"
  on studio_chat_messages for insert
  with check (
    student_user_id = auth.uid()
    and sender_role = 'student'
    and studio_id in (
      select studio_id from teacher_students
      where student_user_id = auth.uid()
      and status = 'active'
    )
  );

-- Enable realtime for live chat updates
alter publication supabase_realtime add table studio_chat_messages;
