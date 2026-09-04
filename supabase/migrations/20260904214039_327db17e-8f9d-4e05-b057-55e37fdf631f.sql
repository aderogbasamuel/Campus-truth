-- ===== enums =====
create type public.app_role as enum ('student','course_rep','admin');
create type public.post_category as enum ('general','academics','exams','registration','hostel','events','opportunities','campus_life','question','announcement');
create type public.report_status as enum ('open','resolved','dismissed');

-- ===== helper =====
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- ===== schools / faculties / departments =====
create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  description text,
  created_at timestamptz not null default now()
);
create table public.faculties (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (school_id, slug)
);
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculties(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (faculty_id, slug)
);

grant select on public.schools, public.faculties, public.departments to anon, authenticated;
grant insert, update, delete on public.schools, public.faculties, public.departments to authenticated;
grant all on public.schools, public.faculties, public.departments to service_role;
alter table public.schools enable row level security;
alter table public.faculties enable row level security;
alter table public.departments enable row level security;

-- ===== profiles + roles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  school_id uuid references public.schools(id) on delete set null,
  faculty_id uuid references public.faculties(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  level text,
  verified boolean not null default false,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;
grant all on public.profiles to service_role;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "profiles readable by everyone" on public.profiles for select using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "admins update profiles" on public.profiles for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "roles readable" on public.user_roles for select to authenticated using (true);

create policy "admins manage schools" on public.schools for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "schools public read" on public.schools for select using (true);
create policy "admins manage faculties" on public.faculties for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "faculties public read" on public.faculties for select using (true);
create policy "admins manage departments" on public.departments for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "departments public read" on public.departments for select using (true);

-- signup trigger: profile + student role + welcome credits
create table public.credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  type text not null,
  description text,
  created_at timestamptz not null default now()
);
grant select on public.credits to authenticated;
grant select on public.credit_transactions to authenticated;
grant all on public.credits, public.credit_transactions to service_role;
alter table public.credits enable row level security;
alter table public.credit_transactions enable row level security;
create policy "own credits" on public.credits for select to authenticated using (auth.uid() = user_id);
create policy "own credit tx" on public.credit_transactions for select to authenticated using (auth.uid() = user_id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          split_part(new.email,'@',1) || '_' || substr(new.id::text,1,4),
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id,'student') on conflict do nothing;
  insert into public.credits (user_id, balance) values (new.id, 25) on conflict do nothing;
  insert into public.credit_transactions (user_id, amount, type, description) values (new.id, 25, 'welcome_bonus','Welcome to CampusTruth');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.spend_credit(_amount integer, _description text)
returns integer language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  update public.credits set balance = balance - _amount, updated_at = now()
  where user_id = auth.uid() and balance >= _amount
  returning balance into new_balance;
  if new_balance is null then raise exception 'INSUFFICIENT_CREDITS'; end if;
  insert into public.credit_transactions (user_id, amount, type, description)
  values (auth.uid(), -_amount, 'ai_usage', _description);
  return new_balance;
end $$;

-- ===== posts / comments / reactions =====
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  faculty_id uuid references public.faculties(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  level text,
  title text,
  content text not null,
  image_url text,
  category public.post_category not null default 'general',
  verified boolean not null default false,
  removed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_school_created_idx on public.posts (school_id, created_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  type text not null default 'like',
  created_at timestamptz not null default now(),
  unique (user_id, post_id, type)
);

grant select, insert, update, delete on public.posts, public.comments, public.reactions to authenticated;
grant all on public.posts, public.comments, public.reactions to service_role;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;

create policy "posts readable" on public.posts for select to authenticated using (not removed or public.has_role(auth.uid(),'admin'));
create policy "create own post" on public.posts for insert to authenticated with check (auth.uid() = author_id);
create policy "update own post" on public.posts for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "delete own post" on public.posts for delete to authenticated using (auth.uid() = author_id);
create policy "admins moderate posts" on public.posts for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "comments readable" on public.comments for select to authenticated using (true);
create policy "create own comment" on public.comments for insert to authenticated with check (auth.uid() = author_id);
create policy "delete own comment" on public.comments for delete to authenticated using (auth.uid() = author_id);
create policy "admins moderate comments" on public.comments for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "reactions readable" on public.reactions for select to authenticated using (true);
create policy "manage own reactions" on public.reactions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===== questions / answers =====
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  school_id uuid references public.schools(id) on delete set null,
  faculty_id uuid references public.faculties(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  level text,
  title text not null,
  content text,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  is_best boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.questions, public.answers to authenticated;
grant all on public.questions, public.answers to service_role;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
create policy "questions readable" on public.questions for select to authenticated using (true);
create policy "create own question" on public.questions for insert to authenticated with check (auth.uid() = author_id);
create policy "update own question" on public.questions for update to authenticated using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "delete own question" on public.questions for delete to authenticated using (auth.uid() = author_id);
create policy "admins moderate questions" on public.questions for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "answers readable" on public.answers for select to authenticated using (true);
create policy "create own answer" on public.answers for insert to authenticated with check (auth.uid() = author_id);
create policy "delete own answer" on public.answers for delete to authenticated using (auth.uid() = author_id);
create policy "question owner marks best" on public.answers for update to authenticated
  using (exists (select 1 from public.questions q where q.id = question_id and q.author_id = auth.uid()))
  with check (exists (select 1 from public.questions q where q.id = question_id and q.author_id = auth.uid()));
create policy "admins moderate answers" on public.answers for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ===== announcements / knowledge =====
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  title text not null,
  content text not null,
  source_name text,
  source_url text,
  confidence integer,
  verified boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  title text not null,
  content text not null,
  source_name text,
  source_url text,
  category text,
  verified boolean not null default true,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.announcements, public.knowledge_sources to anon, authenticated;
grant insert, update, delete on public.announcements, public.knowledge_sources to authenticated;
grant all on public.announcements, public.knowledge_sources to service_role;
alter table public.announcements enable row level security;
alter table public.knowledge_sources enable row level security;
create policy "announcements public read" on public.announcements for select using (true);
create policy "admins manage announcements" on public.announcements for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "knowledge public read" on public.knowledge_sources for select using (verified);
create policy "admins manage knowledge" on public.knowledge_sources for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ===== communities =====
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools(id) on delete cascade,
  faculty_id uuid references public.faculties(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  level text,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
grant select on public.communities to anon, authenticated;
grant insert, update, delete on public.communities to authenticated;
grant select, insert, delete on public.community_members to authenticated;
grant all on public.communities, public.community_members to service_role;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
create policy "communities public read" on public.communities for select using (true);
create policy "admins manage communities" on public.communities for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "members readable" on public.community_members for select to authenticated using (true);
create policy "join leave own" on public.community_members for insert to authenticated with check (auth.uid() = user_id);
create policy "leave own" on public.community_members for delete to authenticated using (auth.uid() = user_id);

-- ===== AI conversations =====
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null,
  content text not null,
  sources jsonb,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.conversations, public.messages to authenticated;
grant all on public.conversations, public.messages to service_role;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
create policy "own conversations" on public.conversations for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own messages" on public.messages for all to authenticated
  using (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));

-- ===== notifications / saved / reports =====
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  read boolean not null default false,
  related_id uuid,
  created_at timestamptz not null default now()
);
create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null,
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  details text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
grant select, insert, update, delete on public.notifications, public.saved_items to authenticated;
grant select, insert, update on public.reports to authenticated;
grant all on public.notifications, public.saved_items, public.reports to service_role;
alter table public.notifications enable row level security;
alter table public.saved_items enable row level security;
alter table public.reports enable row level security;
create policy "own notifications" on public.notifications for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own saved items" on public.saved_items for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "file own report" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "see own reports" on public.reports for select to authenticated using (auth.uid() = reporter_id or public.has_role(auth.uid(),'admin'));
create policy "admins resolve reports" on public.reports for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- notify on comment / answer
create or replace function public.notify_on_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  select author_id into target from public.posts where id = new.post_id;
  if target is not null and target <> new.author_id then
    insert into public.notifications (user_id, type, title, message, related_id)
    values (target,'comment','New comment on your post', left(new.content,120), new.post_id);
  end if;
  return new;
end $$;
create trigger comments_notify after insert on public.comments for each row execute function public.notify_on_comment();

create or replace function public.notify_on_answer() returns trigger
language plpgsql security definer set search_path = public as $$
declare target uuid;
begin
  select author_id into target from public.questions where id = new.question_id;
  if target is not null and target <> new.author_id then
    insert into public.notifications (user_id, type, title, message, related_id)
    values (target,'answer','Your question got an answer', left(new.content,120), new.question_id);
  end if;
  return new;
end $$;
create trigger answers_notify after insert on public.answers for each row execute function public.notify_on_answer();

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger posts_touch before update on public.posts for each row execute function public.touch_updated_at();
create trigger questions_touch before update on public.questions for each row execute function public.touch_updated_at();
create trigger conversations_touch before update on public.conversations for each row execute function public.touch_updated_at();

-- ===== seed: UNILAG =====
insert into public.schools (id, name, slug, description) values
  ('11111111-1111-1111-1111-111111111111','University of Lagos','unilag','Akoka, Lagos. CampusTruth pilot school.');

insert into public.faculties (id, school_id, name, slug) values
  ('22222222-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','Faculty of Engineering','engineering'),
  ('22222222-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','Faculty of Science','science'),
  ('22222222-0000-0000-0000-000000000003','11111111-1111-1111-1111-111111111111','Faculty of Arts','arts'),
  ('22222222-0000-0000-0000-000000000004','11111111-1111-1111-1111-111111111111','Faculty of Law','law'),
  ('22222222-0000-0000-0000-000000000005','11111111-1111-1111-1111-111111111111','Faculty of Social Sciences','social-sciences'),
  ('22222222-0000-0000-0000-000000000006','11111111-1111-1111-1111-111111111111','Faculty of Management Sciences','management-sciences');

insert into public.departments (id, faculty_id, name, slug) values
  ('33333333-0000-0000-0000-000000000001','22222222-0000-0000-0000-000000000001','Computer Engineering','computer-engineering'),
  ('33333333-0000-0000-0000-000000000002','22222222-0000-0000-0000-000000000001','Electrical & Electronics Engineering','electrical-electronics'),
  ('33333333-0000-0000-0000-000000000003','22222222-0000-0000-0000-000000000001','Civil & Environmental Engineering','civil-environmental'),
  ('33333333-0000-0000-0000-000000000004','22222222-0000-0000-0000-000000000002','Computer Sciences','computer-sciences'),
  ('33333333-0000-0000-0000-000000000005','22222222-0000-0000-0000-000000000002','Mathematics','mathematics'),
  ('33333333-0000-0000-0000-000000000006','22222222-0000-0000-0000-000000000003','English','english'),
  ('33333333-0000-0000-0000-000000000007','22222222-0000-0000-0000-000000000004','Private & Property Law','private-property-law'),
  ('33333333-0000-0000-0000-000000000008','22222222-0000-0000-0000-000000000005','Economics','economics'),
  ('33333333-0000-0000-0000-000000000009','22222222-0000-0000-0000-000000000006','Accounting','accounting');

insert into public.communities (school_id, faculty_id, department_id, level, name, description) values
  ('11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000001',null,null,'Faculty of Engineering','Updates and discussions for Engineering students.'),
  ('11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000001','33333333-0000-0000-0000-000000000001','100','Computer Engineering · 100 Level','Course-level updates for CPE 100L.'),
  ('11111111-1111-1111-1111-111111111111','22222222-0000-0000-0000-000000000002','33333333-0000-0000-0000-000000000004',null,'Computer Sciences','Everything happening in Computer Sciences.'),
  ('11111111-1111-1111-1111-111111111111',null,null,null,'UNILAG General','Campus-wide announcements and student chatter.');

insert into public.announcements (school_id, title, content, source_name, source_url, confidence, verified, published_at) values
  ('11111111-1111-1111-1111-111111111111','UNILAG Senate Approves New Academic Calendar','The Senate has approved minor adjustments to the academic calendar. Week 7 now includes an additional lecture-free day planned for faculty restructuring.','UNILAG Senate','https://unilag.edu.ng',98,true, now() - interval '27 minutes'),
  ('11111111-1111-1111-1111-111111111111','Hostel Ballot Timeline Revised','The hostel balloting window has been extended. Students who have paid accommodation charges should check the portal for their allocation status.','UNILAG Official IG','https://unilag.edu.ng',95,true, now() - interval '2 hours'),
  ('11111111-1111-1111-1111-111111111111','Course Registration Closes End of Week','Course registration on the student portal closes at the end of the week. Late registration attracts an administrative charge.','UNILAG Registry','https://unilag.edu.ng',97,true, now() - interval '1 day');

insert into public.knowledge_sources (school_id, title, content, source_name, source_url, category, verified, published_at) values
  ('11111111-1111-1111-1111-111111111111','Academic Calendar 2026/2027','First semester lectures begin in October and run for 15 weeks. A one-week revision period precedes examinations. Second semester resumes in March. Week 7 of first semester includes an additional lecture-free day.','UNILAG Senate','https://unilag.edu.ng/academic-calendar','academics',true, now() - interval '3 days'),
  ('11111111-1111-1111-1111-111111111111','Course Registration Requirements','To register courses you need: a valid matriculation number, evidence of school fees payment, medical clearance for fresh students, and your level adviser''s approval on the portal. Registration closes two weeks after lectures begin.','UNILAG Registry','https://unilag.edu.ng/registration','registration',true, now() - interval '5 days'),
  ('11111111-1111-1111-1111-111111111111','Hostel Balloting Process','Accommodation is allocated by ballot. Students pay the accommodation charge, then ballot on the student portal during the published window. Allocation results appear on the portal and at the Student Affairs Division.','UNILAG Student Affairs','https://unilag.edu.ng/hostel','hostel',true, now() - interval '4 days'),
  ('11111111-1111-1111-1111-111111111111','Examination Rules and Clearance','Students must complete course registration and have at least 75% attendance to sit for examinations. Exam dockets are printed from the portal. Only approved calculators and materials are permitted in the hall.','UNILAG Examinations Office','https://unilag.edu.ng/exams','exams',true, now() - interval '6 days'),
  ('11111111-1111-1111-1111-111111111111','Contacting Your Department','Departmental offices are open weekdays, 9am to 4pm. Route academic issues through your level adviser first, then the departmental office, then the faculty officer. Student Affairs handles accommodation and welfare matters.','UNILAG Registry','https://unilag.edu.ng/contact','contacts',true, now() - interval '7 days');