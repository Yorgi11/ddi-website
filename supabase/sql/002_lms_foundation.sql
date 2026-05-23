create extension if not exists pgcrypto;

alter table profiles add column if not exists is_instructor boolean not null default false;

alter table payments add column if not exists course_id uuid;
alter table payments add column if not exists course_level_id uuid;
alter table payments add column if not exists class_section_id uuid;
alter table payments add column if not exists enrollment_id uuid;

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  description text,
  priority integer not null default 1,
  certificate_title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists course_levels (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  slug text not null,
  level_number integer not null,
  title text not null,
  summary text,
  description text,
  syllabus text,
  completion_requirements jsonb not null default '{}'::jsonb,
  prerequisite_course_level_id uuid references course_levels(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, slug),
  unique(course_id, level_number)
);

create table if not exists class_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  course_level_id uuid not null references course_levels(id) on delete cascade,
  instructor_id uuid references profiles(id),
  title text not null,
  delivery_mode text not null default 'online',
  location text,
  meeting_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  enrollment_opens_at timestamptz,
  enrollment_closes_at timestamptz,
  capacity integer,
  price_cents integer not null default 0,
  currency text not null default 'CAD',
  status text not null default 'draft',
  google_calendar_id text,
  google_calendar_event_id text,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_sections_status_check
    check (status in ('draft', 'open', 'closed', 'in_progress', 'completed', 'archived')),
  constraint class_sections_delivery_mode_check
    check (delivery_mode in ('online', 'in_person', 'hybrid'))
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  course_level_id uuid not null references course_levels(id) on delete cascade,
  class_section_id uuid not null references class_sections(id) on delete cascade,
  status text not null default 'enrolled',
  current_grade numeric(5,2),
  final_grade numeric(5,2),
  completed_at timestamptz,
  completion_approved_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enrollments_status_check
    check (status in ('pending_payment', 'paid', 'enrolled', 'in_progress', 'completed', 'withdrawn', 'failed')),
  unique(user_id, class_section_id)
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  class_section_id uuid not null references class_sections(id) on delete cascade,
  title text not null,
  description text,
  instructions text,
  due_at timestamptz,
  points_possible numeric(8,2) not null default 100,
  weight numeric(5,2) not null default 1,
  submission_type text not null default 'text',
  accepts_late boolean not null default true,
  is_required boolean not null default true,
  is_published boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignments_submission_type_check
    check (submission_type in ('text', 'file', 'link', 'code', 'mixed'))
);

create table if not exists assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'draft',
  text_response text,
  link_url text,
  storage_path text,
  submitted_at timestamptz,
  returned_at timestamptz,
  points_awarded numeric(8,2),
  grade_percent numeric(5,2),
  feedback text,
  graded_by uuid references profiles(id),
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignment_submissions_status_check
    check (status in ('not_started', 'draft', 'submitted', 'late', 'graded', 'missing', 'returned', 'resubmitted')),
  unique(assignment_id, enrollment_id)
);

create table if not exists grades (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete cascade,
  assignment_submission_id uuid references assignment_submissions(id) on delete cascade,
  grade_percent numeric(5,2) not null,
  points_awarded numeric(8,2),
  points_possible numeric(8,2),
  weight numeric(5,2) not null default 1,
  feedback text,
  graded_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists class_posts (
  id uuid primary key default gen_random_uuid(),
  class_section_id uuid not null references class_sections(id) on delete cascade,
  title text not null,
  body text,
  content jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists class_post_media (
  id uuid primary key default gen_random_uuid(),
  class_post_id uuid not null references class_posts(id) on delete cascade,
  type text not null,
  url text,
  storage_path text,
  title text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint class_post_media_type_check
    check (type in ('image', 'link', 'youtube', 'mp4', 'file'))
);

create table if not exists schedule_events (
  id uuid primary key default gen_random_uuid(),
  class_section_id uuid not null references class_sections(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  meeting_url text,
  google_calendar_event_id text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  class_section_id uuid references class_sections(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  constraint notifications_type_check
    check (type in ('assignment_due', 'class_starting', 'new_post', 'grade_posted', 'badge_earned', 'certificate_issued', 'general'))
);

create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  course_id uuid references courses(id) on delete cascade,
  course_level_id uuid references course_levels(id) on delete cascade,
  type text not null default 'level',
  image_storage_path text,
  created_at timestamptz not null default now(),
  constraint badges_type_check check (type in ('level', 'course_achievement'))
);

create table if not exists student_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  enrollment_id uuid references enrollments(id) on delete set null,
  display_status text not null default 'visible',
  awarded_at timestamptz not null default now(),
  awarded_by uuid references profiles(id),
  constraint student_badges_display_status_check
    check (display_status in ('visible', 'hidden', 'replaced', 'revoked')),
  unique(user_id, badge_id, enrollment_id)
);

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  certificate_title text not null,
  certificate_code text unique not null,
  certificate_text text not null,
  issued_at timestamptz not null default now(),
  issued_by uuid references profiles(id),
  pdf_storage_path text,
  revoked_at timestamptz,
  revoked_by uuid references profiles(id)
);

create or replace function public.is_lms_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from profiles where id = check_user_id),
    false
  );
$$;

create or replace function public.is_section_instructor(section_id uuid, check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from class_sections
    where id = section_id
      and instructor_id = check_user_id
  );
$$;

create or replace function public.is_enrolled_in_section(section_id uuid, check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from enrollments
    where class_section_id = section_id
      and user_id = check_user_id
      and status in ('paid', 'enrolled', 'in_progress', 'completed')
  );
$$;

alter table courses enable row level security;
alter table course_levels enable row level security;
alter table class_sections enable row level security;
alter table enrollments enable row level security;
alter table assignments enable row level security;
alter table assignment_submissions enable row level security;
alter table grades enable row level security;
alter table class_posts enable row level security;
alter table class_post_media enable row level security;
alter table schedule_events enable row level security;
alter table notifications enable row level security;
alter table badges enable row level security;
alter table student_badges enable row level security;
alter table certificates enable row level security;

drop policy if exists "Active courses are readable" on courses;
drop policy if exists "Admins manage courses" on courses;
drop policy if exists "Active course levels are readable" on course_levels;
drop policy if exists "Admins manage course levels" on course_levels;
drop policy if exists "Open class sections are readable" on class_sections;
drop policy if exists "Admins manage class sections" on class_sections;
drop policy if exists "Students read own enrollments" on enrollments;
drop policy if exists "Admins manage enrollments" on enrollments;
drop policy if exists "Students read class assignments" on assignments;
drop policy if exists "Instructors manage section assignments" on assignments;
drop policy if exists "Students manage own submissions" on assignment_submissions;
drop policy if exists "Instructors read section submissions" on assignment_submissions;
drop policy if exists "Students read own grades" on grades;
drop policy if exists "Admins manage grades" on grades;
drop policy if exists "Students read class posts" on class_posts;
drop policy if exists "Instructors manage section posts" on class_posts;
drop policy if exists "Students read class post media" on class_post_media;
drop policy if exists "Instructors manage class post media" on class_post_media;
drop policy if exists "Students read class schedule" on schedule_events;
drop policy if exists "Instructors manage section schedule" on schedule_events;
drop policy if exists "Users read own notifications" on notifications;
drop policy if exists "Users update own notification read state" on notifications;
drop policy if exists "Instructors create section notifications" on notifications;
drop policy if exists "Admins manage notifications" on notifications;
drop policy if exists "Badges are readable" on badges;
drop policy if exists "Admins manage badges" on badges;
drop policy if exists "Students read own badges" on student_badges;
drop policy if exists "Admins manage student badges" on student_badges;
drop policy if exists "Students read own certificates" on certificates;
drop policy if exists "Admins manage certificates" on certificates;

create policy "Active courses are readable" on courses
  for select using (is_active or public.is_lms_admin(auth.uid()));

create policy "Admins manage courses" on courses
  for all using (public.is_lms_admin(auth.uid()))
  with check (public.is_lms_admin(auth.uid()));

create policy "Active course levels are readable" on course_levels
  for select using (is_active or public.is_lms_admin(auth.uid()));

create policy "Admins manage course levels" on course_levels
  for all using (public.is_lms_admin(auth.uid()))
  with check (public.is_lms_admin(auth.uid()));

create policy "Open class sections are readable" on class_sections
  for select using (
    status in ('open', 'in_progress', 'completed')
    or public.is_section_instructor(id, auth.uid())
    or public.is_lms_admin(auth.uid())
  );

create policy "Admins manage class sections" on class_sections
  for all using (public.is_lms_admin(auth.uid()))
  with check (public.is_lms_admin(auth.uid()));

create policy "Students read own enrollments" on enrollments
  for select using (
    user_id = auth.uid()
    or public.is_section_instructor(class_section_id, auth.uid())
    or public.is_lms_admin(auth.uid())
  );

create policy "Admins manage enrollments" on enrollments
  for all using (public.is_lms_admin(auth.uid()))
  with check (public.is_lms_admin(auth.uid()));

create policy "Students read class assignments" on assignments
  for select using (
    is_published and public.is_enrolled_in_section(class_section_id, auth.uid())
    or public.is_section_instructor(class_section_id, auth.uid())
    or public.is_lms_admin(auth.uid())
  );

create policy "Instructors manage section assignments" on assignments
  for all using (
    public.is_section_instructor(class_section_id, auth.uid())
    or public.is_lms_admin(auth.uid())
  )
  with check (
    public.is_section_instructor(class_section_id, auth.uid())
    or public.is_lms_admin(auth.uid())
  );

create policy "Students manage own submissions" on assignment_submissions
  for all using (
    user_id = auth.uid()
    or public.is_lms_admin(auth.uid())
  )
  with check (
    user_id = auth.uid()
    or public.is_lms_admin(auth.uid())
  );

create policy "Instructors read section submissions" on assignment_submissions
  for select using (
    exists (
      select 1
      from assignments
      where assignments.id = assignment_submissions.assignment_id
        and (
          public.is_section_instructor(assignments.class_section_id, auth.uid())
          or public.is_lms_admin(auth.uid())
        )
    )
  );

revoke update (
  points_awarded,
  grade_percent,
  feedback,
  graded_by,
  graded_at
) on assignment_submissions from authenticated;

create policy "Students read own grades" on grades
  for select using (
    exists (
      select 1 from enrollments
      where enrollments.id = grades.enrollment_id
        and enrollments.user_id = auth.uid()
    )
    or public.is_lms_admin(auth.uid())
  );

create policy "Admins manage grades" on grades
  for all using (public.is_lms_admin(auth.uid()))
  with check (public.is_lms_admin(auth.uid()));

create policy "Students read class posts" on class_posts
  for select using (
    is_published and public.is_enrolled_in_section(class_section_id, auth.uid())
    or public.is_section_instructor(class_section_id, auth.uid())
    or public.is_lms_admin(auth.uid())
  );

create policy "Instructors manage section posts" on class_posts
  for all using (
    public.is_section_instructor(class_section_id, auth.uid())
    or public.is_lms_admin(auth.uid())
  )
  with check (
    public.is_section_instructor(class_section_id, auth.uid())
    or public.is_lms_admin(auth.uid())
  );

create policy "Students read class post media" on class_post_media
  for select using (
    exists (
      select 1 from class_posts
      where class_posts.id = class_post_media.class_post_id
        and (
          public.is_enrolled_in_section(class_posts.class_section_id, auth.uid())
          or public.is_section_instructor(class_posts.class_section_id, auth.uid())
          or public.is_lms_admin(auth.uid())
        )
    )
  );

create policy "Instructors manage class post media" on class_post_media
  for all using (
    exists (
      select 1 from class_posts
      where class_posts.id = class_post_media.class_post_id
        and (
          public.is_section_instructor(class_posts.class_section_id, auth.uid())
          or public.is_lms_admin(auth.uid())
        )
    )
  )
  with check (
    exists (
      select 1 from class_posts
      where class_posts.id = class_post_media.class_post_id
        and (
          public.is_section_instructor(class_posts.class_section_id, auth.uid())
          or public.is_lms_admin(auth.uid())
        )
    )
  );

create policy "Students read class schedule" on schedule_events
  for select using (
    public.is_enrolled_in_section(class_section_id, auth.uid())
    or public.is_section_instructor(class_section_id, auth.uid())
    or public.is_lms_admin(auth.uid())
  );

create policy "Instructors manage section schedule" on schedule_events
  for all using (
    public.is_section_instructor(class_section_id, auth.uid())
    or public.is_lms_admin(auth.uid())
  )
  with check (
    public.is_section_instructor(class_section_id, auth.uid())
    or public.is_lms_admin(auth.uid())
  );

create policy "Users read own notifications" on notifications
  for select using (
    user_id = auth.uid()
    or public.is_lms_admin(auth.uid())
  );

create policy "Users update own notification read state" on notifications
  for update using (
    user_id = auth.uid()
    or public.is_lms_admin(auth.uid())
  )
  with check (
    user_id = auth.uid()
    or public.is_lms_admin(auth.uid())
  );

create policy "Instructors create section notifications" on notifications
  for insert with check (
    public.is_section_instructor(class_section_id, auth.uid())
    or public.is_lms_admin(auth.uid())
  );

create policy "Admins manage notifications" on notifications
  for all using (public.is_lms_admin(auth.uid()))
  with check (public.is_lms_admin(auth.uid()));

create policy "Badges are readable" on badges
  for select using (true);

create policy "Admins manage badges" on badges
  for all using (public.is_lms_admin(auth.uid()))
  with check (public.is_lms_admin(auth.uid()));

create policy "Students read own badges" on student_badges
  for select using (
    user_id = auth.uid()
    or public.is_lms_admin(auth.uid())
  );

create policy "Admins manage student badges" on student_badges
  for all using (public.is_lms_admin(auth.uid()))
  with check (public.is_lms_admin(auth.uid()));

create policy "Students read own certificates" on certificates
  for select using (
    user_id = auth.uid()
    or public.is_lms_admin(auth.uid())
  );

create policy "Admins manage certificates" on certificates
  for all using (public.is_lms_admin(auth.uid()))
  with check (public.is_lms_admin(auth.uid()));

insert into storage.buckets (id, name, public)
values
  ('class-post-media', 'class-post-media', false),
  ('assignment-submissions', 'assignment-submissions', false),
  ('badge-images', 'badge-images', true),
  ('certificate-pdfs', 'certificate-pdfs', false),
  ('course-assets', 'course-assets', true)
on conflict (id) do nothing;

drop policy if exists "Authenticated users read class post media" on storage.objects;
drop policy if exists "Instructors upload class post media" on storage.objects;
drop policy if exists "Instructors update class post media" on storage.objects;
drop policy if exists "Students and instructors read submission files" on storage.objects;
drop policy if exists "Students upload own submission files" on storage.objects;
drop policy if exists "Students update own submission files" on storage.objects;

create policy "Authenticated users read class post media" on storage.objects
  for select using (
    bucket_id = 'class-post-media'
    and auth.role() = 'authenticated'
  );

create policy "Instructors upload class post media" on storage.objects
  for insert with check (
    bucket_id = 'class-post-media'
    and (
      public.is_lms_admin(auth.uid())
      or public.is_section_instructor(((storage.foldername(name))[1])::uuid, auth.uid())
    )
  );

create policy "Instructors update class post media" on storage.objects
  for update using (
    bucket_id = 'class-post-media'
    and (
      public.is_lms_admin(auth.uid())
      or public.is_section_instructor(((storage.foldername(name))[1])::uuid, auth.uid())
    )
  )
  with check (
    bucket_id = 'class-post-media'
    and (
      public.is_lms_admin(auth.uid())
      or public.is_section_instructor(((storage.foldername(name))[1])::uuid, auth.uid())
    )
  );

create policy "Students and instructors read submission files" on storage.objects
  for select using (
    bucket_id = 'assignment-submissions'
    and (
      owner = auth.uid()
      or public.is_lms_admin(auth.uid())
      or exists (
        select 1
        from enrollments
        where enrollments.id = ((storage.foldername(name))[2])::uuid
          and public.is_section_instructor(enrollments.class_section_id, auth.uid())
      )
    )
  );

create policy "Students upload own submission files" on storage.objects
  for insert with check (
    bucket_id = 'assignment-submissions'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Students update own submission files" on storage.objects
  for update using (
    bucket_id = 'assignment-submissions'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'assignment-submissions'
    and owner = auth.uid()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

insert into courses (id, slug, title, summary, priority, certificate_title)
values
  ('10000000-0000-4000-8000-000000000001', 'unity-csharp-game-development', 'Programming and Game Development with C# and Unity', 'A complete beginner-to-advanced Unity and C# game development pathway.', 4, 'DDI Certificate in Programming and Game Development with C# and Unity'),
  ('10000000-0000-4000-8000-000000000002', 'p5js-web-games', 'Building Web Games with P5.js', 'A browser-based creative coding and game development track using JavaScript and P5.js.', 4, 'DDI Certificate in Web Game Development with P5.js'),
  ('10000000-0000-4000-8000-000000000003', 'cpp-game-development', 'Programming and Game Development with C++', 'A C++ game programming pathway from console fundamentals to rendering and games.', 2, 'DDI Certificate in C++ Game Programming'),
  ('10000000-0000-4000-8000-000000000004', 'rust-game-development', 'Programming and Game Development with Rust', 'A Rust game programming pathway focused on safe systems programming and game logic.', 2, 'DDI Certificate in Rust Game Programming'),
  ('10000000-0000-4000-8000-000000000005', 'electron-desktop-apps', 'Building Desktop Apps with Electron', 'A practical pathway for building custom cross-platform desktop applications.', 1, 'DDI Certificate in Cross-Platform Desktop App Development with Electron')
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  priority = excluded.priority,
  certificate_title = excluded.certificate_title,
  updated_at = now();

insert into course_levels (id, course_id, slug, level_number, title, summary)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'unity-csharp-level-1', 1, 'Intro to C#, Console App', 'Programming fundamentals using C# console applications.'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'unity-csharp-level-2', 2, 'Intro to Unity, Simple C# Unity Scripting', 'Unity editor basics, GameObjects, components, and simple scripts.'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'unity-csharp-level-3', 3, 'Making a Real Game in Unity with C#', 'Build a complete playable Unity game with applied C# systems.'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'unity-csharp-level-4', 4, 'Advanced Unity and C# Programming', 'Advanced gameplay systems, polish, architecture, and production habits.'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 'p5js-level-1', 1, 'Intro to P5.js', 'Creative coding fundamentals with drawing, input, and motion.'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'p5js-level-2', 2, 'Intermediate JavaScript Programming in P5.js', 'Reusable functions, state, arrays, collision logic, and structured sketches.'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'p5js-level-3', 3, 'Advanced Game Development Concepts in P5.js', 'Build larger web games with scenes, progression, scoring, and polish.'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', 'cpp-level-1', 1, 'Intro to C++, Console App', 'C++ syntax, input, control flow, and console applications.'),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', 'cpp-level-2', 2, 'Intermediate C++ Concepts, Rendering to the Screen', 'Core C++ structures and first steps into drawing and rendering output.'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000003', 'cpp-level-3', 3, 'Your First C++ Game', 'Build a complete small game with C++ programming concepts.'),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000003', 'cpp-level-4', 4, 'Advanced C++ Programming for Games', 'Advanced game programming patterns, systems, and performance habits.'),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000004', 'rust-level-1', 1, 'Intro to Rust, Console App', 'Rust fundamentals, ownership basics, and console programs.'),
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000004', 'rust-level-2', 2, 'Intermediate Rust Concepts, Rendering to the Screen', 'Rust data modeling, modules, and rendering-focused application structure.'),
  ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000004', 'rust-level-3', 3, 'Your First Rust Game', 'Build a complete small game using Rust concepts.'),
  ('20000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000004', 'rust-level-4', 4, 'Advanced Rust Programming for Games', 'Advanced Rust patterns and applied game development architecture.'),
  ('20000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000005', 'electron-level-1', 1, 'Intro to Electron', 'Electron fundamentals and first desktop app structure.'),
  ('20000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000005', 'electron-level-2', 2, 'Building Custom Cross-Platform Apps', 'Create richer app workflows with storage, menus, packaging, and UI polish.'),
  ('20000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000005', 'electron-level-3', 3, 'Advanced Electron Development', 'Production-focused Electron architecture, distribution, and advanced integrations.')
on conflict (course_id, slug) do update set
  level_number = excluded.level_number,
  title = excluded.title,
  summary = excluded.summary,
  updated_at = now();

update course_levels set prerequisite_course_level_id = '20000000-0000-4000-8000-000000000001'
where id = '20000000-0000-4000-8000-000000000002';
update course_levels set prerequisite_course_level_id = '20000000-0000-4000-8000-000000000002'
where id = '20000000-0000-4000-8000-000000000003';
update course_levels set prerequisite_course_level_id = '20000000-0000-4000-8000-000000000003'
where id = '20000000-0000-4000-8000-000000000004';
update course_levels set prerequisite_course_level_id = '20000000-0000-4000-8000-000000000005'
where id = '20000000-0000-4000-8000-000000000006';
update course_levels set prerequisite_course_level_id = '20000000-0000-4000-8000-000000000006'
where id = '20000000-0000-4000-8000-000000000007';
update course_levels set prerequisite_course_level_id = '20000000-0000-4000-8000-000000000008'
where id = '20000000-0000-4000-8000-000000000009';
update course_levels set prerequisite_course_level_id = '20000000-0000-4000-8000-000000000009'
where id = '20000000-0000-4000-8000-000000000010';
update course_levels set prerequisite_course_level_id = '20000000-0000-4000-8000-000000000010'
where id = '20000000-0000-4000-8000-000000000011';
update course_levels set prerequisite_course_level_id = '20000000-0000-4000-8000-000000000012'
where id = '20000000-0000-4000-8000-000000000013';
update course_levels set prerequisite_course_level_id = '20000000-0000-4000-8000-000000000013'
where id = '20000000-0000-4000-8000-000000000014';
update course_levels set prerequisite_course_level_id = '20000000-0000-4000-8000-000000000014'
where id = '20000000-0000-4000-8000-000000000015';
update course_levels set prerequisite_course_level_id = '20000000-0000-4000-8000-000000000016'
where id = '20000000-0000-4000-8000-000000000017';
update course_levels set prerequisite_course_level_id = '20000000-0000-4000-8000-000000000017'
where id = '20000000-0000-4000-8000-000000000018';
