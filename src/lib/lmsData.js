import { COURSES, findCourse } from "../data/courses";

export function normalizeCatalogCourses(courses = [], levels = []) {
  const levelsByCourseId = levels.reduce((groups, level) => {
    const group = groups.get(level.course_id) ?? [];
    group.push(level);
    groups.set(level.course_id, group);
    return groups;
  }, new Map());

  return courses.map((course) => {
    const courseLevels = levelsByCourseId.get(course.id) ?? [];
    const levelSlugById = new Map(
      courseLevels.map((level) => [level.id, level.slug]),
    );

    return {
      id: course.slug,
      dbId: course.id,
      title: course.title,
      summary: course.summary ?? "",
      description: course.description ?? "",
      certificateTitle: course.certificate_title ?? "",
      isActive: course.is_active !== false,
      levels: courseLevels.map((level) => ({
        id: level.slug,
        dbId: level.id,
        courseDbId: level.course_id,
        levelNumber: level.level_number,
        title: level.title,
        summary: level.summary ?? "",
        description: level.description ?? "",
        syllabus: level.syllabus ?? "",
        prerequisiteLevelId:
          levelSlugById.get(level.prerequisite_course_level_id) ?? null,
        isActive: level.is_active !== false,
      })),
    };
  });
}

export function getCourseTitle(courseId) {
  return findCourse(courseId)?.title ?? courseId ?? "Course";
}

export function getCourseLevel(courseId, levelId) {
  const course = findCourse(courseId);
  return course?.levels.find((level) => level.id === levelId) ?? null;
}

export function normalizeEnrollment(row) {
  const courseSlug = row.course?.slug ?? row.course_slug ?? row.course_id;
  const levelSlug =
    row.course_level?.slug ?? row.course_level_slug ?? row.course_level_id;
  const fallbackCourse = findCourse(courseSlug);
  const fallbackLevel =
    fallbackCourse?.levels.find((level) => level.id === levelSlug) ?? null;

  return {
    id: row.id,
    status: row.status ?? "enrolled",
    currentGrade: row.current_grade ?? null,
    finalGrade: row.final_grade ?? null,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    course: {
      id: courseSlug,
      title: row.course?.title ?? fallbackCourse?.title ?? "Course",
      summary: row.course?.summary ?? fallbackCourse?.summary ?? "",
      certificateTitle:
        row.course?.certificate_title ?? fallbackCourse?.certificateTitle ?? "",
      levels: fallbackCourse?.levels ?? [],
    },
    level: {
      id: levelSlug,
      title: row.course_level?.title ?? fallbackLevel?.title ?? "Class Level",
      levelNumber:
        row.course_level?.level_number ?? fallbackLevel?.levelNumber ?? null,
      summary: row.course_level?.summary ?? fallbackLevel?.summary ?? "",
      syllabus: row.course_level?.syllabus ?? "",
    },
    section: {
      id: row.class_section?.id ?? row.class_section_id,
      title: row.class_section?.title ?? "Class Section",
      instructorId: row.class_section?.instructor_id ?? null,
      deliveryMode: row.class_section?.delivery_mode ?? "online",
      location: row.class_section?.location ?? "",
      meetingUrl: row.class_section?.meeting_url ?? "",
      startsAt: row.class_section?.starts_at ?? null,
      endsAt: row.class_section?.ends_at ?? null,
      status: row.class_section?.status ?? "open",
    },
  };
}

export function getCurrentEnrollment(enrollments = []) {
  return (
    enrollments.find((item) =>
      ["in_progress", "enrolled", "paid"].includes(item.status),
    ) ??
    enrollments[0] ??
    null
  );
}

export function getCatalogCourseProgress(course, enrollments = []) {
  const completed = enrollments.filter(
    (item) => item.course.id === course.id && item.status === "completed",
  ).length;

  return {
    completed,
    total: course.levels.length,
    percent:
      course.levels.length > 0
        ? Math.round((completed / course.levels.length) * 100)
        : 0,
  };
}

export function getVisibleCatalogCourses(catalogCourses = COURSES, enrollments = []) {
  const enrolledCourseIds = new Set(enrollments.map((item) => item.course.id));

  return catalogCourses.map((course) => ({
    ...course,
    isEnrolled: enrolledCourseIds.has(course.id),
    progress: getCatalogCourseProgress(course, enrollments),
  }));
}
