import { supabase } from "./supabase";
import { normalizeCatalogCourses, normalizeEnrollment } from "./lmsData";

export async function fetchCourseCatalog() {
  const [courseResult, levelResult] = await Promise.all([
    supabase
      .from("courses")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .order("title", { ascending: true }),
    supabase
      .from("course_levels")
      .select("*")
      .eq("is_active", true)
      .order("level_number", { ascending: true }),
  ]);

  const error = courseResult.error || levelResult.error || null;

  if (error) {
    return { courses: [], error };
  }

  return {
    courses: normalizeCatalogCourses(courseResult.data ?? [], levelResult.data ?? []),
    error: null,
  };
}

export async function fetchCourseCatalogItem(courseSlug) {
  const { courses, error } = await fetchCourseCatalog();

  return {
    course: courses.find((course) => course.id === courseSlug) ?? null,
    error,
  };
}

export async function fetchStudentEnrollments(userId) {
  if (!userId) return { enrollments: [], error: null };

  const { data, error } = await supabase
    .from("enrollments")
    .select(
      `
      *,
      course:courses(slug,title,summary,certificate_title),
      course_level:course_levels(slug,level_number,title,summary,syllabus),
      class_section:class_sections(id,title,instructor_id,delivery_mode,location,meeting_url,starts_at,ends_at,status)
    `,
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return { enrollments: [], error };
  }

  return { enrollments: (data ?? []).map(normalizeEnrollment), error: null };
}

export async function fetchClassWorkspace(userId, classSectionId) {
  if (!userId || !classSectionId) {
    return {
      enrollment: null,
      assignments: [],
      submissions: [],
      posts: [],
      scheduleEvents: [],
      error: null,
    };
  }

  const enrollmentResult = await supabase
    .from("enrollments")
    .select(
      `
      *,
      course:courses(slug,title,summary,certificate_title),
      course_level:course_levels(slug,level_number,title,summary,syllabus),
      class_section:class_sections(id,title,instructor_id,delivery_mode,location,meeting_url,starts_at,ends_at,status)
    `,
    )
    .eq("user_id", userId)
    .eq("class_section_id", classSectionId)
    .maybeSingle();

  if (enrollmentResult.error) {
    return {
      enrollment: null,
      assignments: [],
      submissions: [],
      posts: [],
      scheduleEvents: [],
      error: enrollmentResult.error,
    };
  }

  const [assignmentResult, submissionResult, postResult, scheduleResult] =
    await Promise.all([
      supabase
        .from("assignments")
        .select("*")
        .eq("class_section_id", classSectionId)
        .eq("is_published", true)
        .order("due_at", { ascending: true }),
      supabase
        .from("assignment_submissions")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("class_posts")
        .select("*, media:class_post_media(*)")
        .eq("class_section_id", classSectionId)
        .eq("is_published", true)
        .order("published_at", { ascending: false }),
      supabase
        .from("schedule_events")
        .select("*")
        .eq("class_section_id", classSectionId)
        .order("starts_at", { ascending: true }),
    ]);

  const firstError =
    assignmentResult.error ||
    submissionResult.error ||
    postResult.error ||
    scheduleResult.error ||
    null;

  return {
    enrollment: enrollmentResult.data
      ? normalizeEnrollment(enrollmentResult.data)
      : null,
    assignments: assignmentResult.data ?? [],
    submissions: submissionResult.data ?? [],
    posts: postResult.data ?? [],
    scheduleEvents: scheduleResult.data ?? [],
    error: firstError,
  };
}

export async function fetchOpenClassSections(courseId = null) {
  const { data, error } = await supabase
    .from("class_sections")
    .select(
      `
      *,
      course:courses(slug,title,summary,description,certificate_title),
      course_level:course_levels(slug,level_number,title,summary,description,syllabus)
    `,
    )
    .eq("status", "open")
    .order("starts_at", { ascending: true });

  if (error) {
    return { sections: [], error };
  }

  const sections = courseId
    ? (data ?? []).filter((section) => section.course?.slug === courseId)
    : data ?? [];

  return { sections, error: null };
}

export async function fetchClassSection(classSectionId) {
  if (!classSectionId) return { section: null, error: null };

  const { data, error } = await supabase
    .from("class_sections")
    .select(
      `
      *,
      course:courses(slug,title,summary,description,certificate_title),
      course_level:course_levels(slug,level_number,title,summary,description,syllabus)
    `,
    )
    .eq("id", classSectionId)
    .single();

  return { section: data ?? null, error };
}

export async function fetchStudentAchievements(userId) {
  if (!userId) {
    return { badges: [], certificates: [], error: null };
  }

  const [badgeResult, certificateResult] = await Promise.all([
    supabase
      .from("student_badges")
      .select("*, badge:badges(*)")
      .eq("user_id", userId)
      .order("awarded_at", { ascending: false }),
    supabase
      .from("certificates")
      .select("*, course:courses(slug,title)")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("issued_at", { ascending: false }),
  ]);

  return {
    badges: badgeResult.data ?? [],
    certificates: certificateResult.data ?? [],
    error: badgeResult.error || certificateResult.error || null,
  };
}

export async function fetchStudentNotifications(userId) {
  if (!userId) {
    return { notifications: [], error: null };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*, class_section:class_sections(title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    notifications: data ?? [],
    error,
  };
}
