import { getSupabaseAdmin } from "./_payment-utils.js";

export function getBearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  return header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
}

export async function getRequestUser(context, supabase) {
  const token = getBearerToken(context.request);

  if (!token) {
    throw new Error("Missing authorization token.");
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    throw new Error("Invalid authorization token.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,username,is_admin,is_instructor")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found.");
  }

  return { user: data.user, profile };
}

export async function getAuthedSupabase(context) {
  const supabase = getSupabaseAdmin(context.env);
  const auth = await getRequestUser(context, supabase);
  return { supabase, ...auth };
}

export async function assertInstructorForSection(
  supabase,
  profile,
  classSectionId,
) {
  if (profile.is_admin) return;

  const { data, error } = await supabase
    .from("class_sections")
    .select("id,instructor_id")
    .eq("id", classSectionId)
    .single();

  if (error || !data) {
    throw new Error("Class section not found.");
  }

  if (data.instructor_id !== profile.id) {
    throw new Error("Instructor access is required for this class section.");
  }
}

export function calculateAssignmentPercent(pointsAwarded, pointsPossible) {
  if (!pointsPossible || Number(pointsPossible) <= 0) return null;
  if (pointsAwarded == null) return null;
  return Math.round((Number(pointsAwarded) / Number(pointsPossible)) * 10000) / 100;
}

export function calculateWeightedFinalGrade(grades = []) {
  const gradedItems = grades.filter((grade) => grade.grade_percent != null);
  const totalWeight = gradedItems.reduce(
    (sum, grade) => sum + Number(grade.weight ?? 1),
    0,
  );

  if (totalWeight <= 0) return null;

  const weighted = gradedItems.reduce(
    (sum, grade) =>
      sum + Number(grade.grade_percent) * Number(grade.weight ?? 1),
    0,
  );

  return Math.round((weighted / totalWeight) * 100) / 100;
}

export async function calculateEnrollmentGrade(supabase, enrollmentId) {
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("class_section_id")
    .eq("id", enrollmentId)
    .single();

  if (enrollmentError || !enrollment) {
    throw new Error("Enrollment not found.");
  }

  const { data: assignments, error: assignmentError } = await supabase
    .from("assignments")
    .select("*")
    .eq("class_section_id", enrollment.class_section_id)
    .eq("is_published", true);

  if (assignmentError) {
    throw assignmentError;
  }

  const { data: submissions, error: submissionError } = await supabase
    .from("assignment_submissions")
    .select("*")
    .eq("enrollment_id", enrollmentId);

  if (submissionError) {
    throw submissionError;
  }

  const submissionByAssignment = new Map(
    (submissions ?? []).map((submission) => [
      submission.assignment_id,
      submission,
    ]),
  );

  const grades = (assignments ?? []).map((assignment) => {
    const submission = submissionByAssignment.get(assignment.id);
    const gradePercent =
      submission?.grade_percent ??
      calculateAssignmentPercent(
        submission?.points_awarded,
        assignment.points_possible,
      );

    return {
      grade_percent: gradePercent,
      weight: assignment.weight,
    };
  });

  return calculateWeightedFinalGrade(grades);
}

export function buildCertificateCode(courseSlug, userId) {
  const shortUser = String(userId).replaceAll("-", "").slice(0, 8).toUpperCase();
  const randomPart = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  return `DDI-${String(courseSlug).toUpperCase()}-${shortUser}-${randomPart}`;
}
