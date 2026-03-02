-- Onboarding survey responses collected before free trial
create table if not exists onboarding_surveys (
  id                  uuid        default gen_random_uuid() primary key,
  user_id             uuid        not null references auth.users(id) on delete cascade unique,
  instruments         text[]      not null,
  genres              text[]      not null default '{}',
  birthday            date,
  skill_level         text        not null check (skill_level in ('beginner', 'intermediate', 'advanced', 'professional')),
  practice_frequency  text        not null check (practice_frequency in ('daily', 'few_times_week', 'weekly', 'rarely', 'just_starting')),
  practice_goal       text        not null check (practice_goal in ('build_habit', 'prepare_performance', 'learn_instrument', 'improve_technique', 'have_fun')),
  referral_source     text        not null check (referral_source in ('google_search', 'social_media', 'friend_teacher', 'other')),
  created_at          timestamptz default now()
);

alter table onboarding_surveys enable row level security;

create policy "Users can view their own survey"
  on onboarding_surveys for select
  using (auth.uid() = user_id);

create policy "Users can insert their own survey"
  on onboarding_surveys for insert
  with check (auth.uid() = user_id);
