import { jsonResponse } from "./_payment-utils.js";
import {
  assertInstructorForSection,
  buildCertificateCode,
  calculateEnrollmentGrade,
  getAuthedSupabase,
} from "./_lms-utils.js";

const CERTIFICATE_TEXT =
  "This certificate confirms that the student has successfully completed all required classes in this DDI course and has demonstrated applied understanding of the material covered.";

async function ensureBadge(supabase, badge) {
  const { data, error } = await supabase
    .from("badges")
    .upsert(badge, { onConflict: "slug" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function awardBadge(supabase, userId, badgeId, enrollmentId, awardedBy) {
  const { error } = await supabase.from("student_badges").upsert(
    {
      user_id: userId,
      badge_id: badgeId,
      enrollment_id: enrollmentId,
      display_status: "visible",
      awarded_by: awardedBy,
    },
    { onConflict: "user_id,badge_id,enrollment_id" },
  );

  if (error) throw error;
}

async function maybeIssueCourseCertificate(
  supabase,
  enrollment,
  course,
  level,
  profile,
) {
  const { data: courseLevels, error: levelsError } = await supabase
    .from("course_levels")
    .select("id")
    .eq("course_id", enrollment.course_id)
    .eq("is_active", true);

  if (levelsError) throw levelsError;

  const { data: completedEnrollments, error: completedError } = await supabase
    .from("enrollments")
    .select("course_level_id")
    .eq("user_id", enrollment.user_id)
    .eq("course_id", enrollment.course_id)
    .eq("status", "completed");

  if (completedError) throw completedError;

  const completedLevelIds = new Set([
    ...(completedEnrollments ?? []).map((item) => item.course_level_id),
    enrollment.course_level_id,
  ]);
  const allComplete = (courseLevels ?? []).every((item) =>
    completedLevelIds.has(item.id),
  );

  if (!allComplete) return null;

  const finalBadge = await ensureBadge(supabase, {
    slug: `${course.slug}-course-achievement`,
    title: `${course.title} Achievement`,
    description: `Completed all required levels in ${course.title}.`,
    course_id: course.id,
    type: "course_achievement",
  });

  const { data: levelBadges, error: levelBadgeError } = await supabase
    .from("badges")
    .select("id")
    .eq("course_id", enrollment.course_id)
    .eq("type", "level");

  if (levelBadgeError) throw levelBadgeError;

  const levelBadgeIds = (levelBadges ?? []).map((badge) => badge.id);

  if (levelBadgeIds.length > 0) {
    await supabase
      .from("student_badges")
      .update({ display_status: "replaced" })
      .eq("user_id", enrollment.user_id)
      .eq("display_status", "visible")
      .in("badge_id", levelBadgeIds);
  }

  await awardBadge(
    supabase,
    enrollment.user_id,
    finalBadge.id,
    enrollment.id,
    profile.id,
  );

  const { data: existingCertificate, error: existingError } = await supabase
    .from("certificates")
    .select("id,certificate_code")
    .eq("user_id", enrollment.user_id)
    .eq("course_id", enrollment.course_id)
    .is("revoked_at", null)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingCertificate) return existingCertificate;

  const { data: certificate, error: certificateError } = await supabase
    .from("certificates")
    .insert({
      user_id: enrollment.user_id,
      course_id: enrollment.course_id,
      certificate_title: course.certificate_title || course.title,
      certificate_code: buildCertificateCode(course.slug, enrollment.user_id),
      certificate_text: CERTIFICATE_TEXT,
      issued_by: profile.id,
    })
    .select("id,certificate_code")
    .single();

  if (certificateError) throw certificateError;

  return certificate;
}

export async function onRequestPost(context) {
  try {
    const { supabase, profile } = await getAuthedSupabase(context);
    const { enrollmentId, override = false } = await context.request.json();

    if (!enrollmentId) {
      return jsonResponse({ error: "Missing enrollmentId." }, 400);
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from("enrollments")
      .select(
        `
        *,
        course:courses(*),
        course_level:course_levels(*)
      `,
      )
      .eq("id", enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      return jsonResponse({ error: "Enrollment not found." }, 404);
    }

    await assertInstructorForSection(
      supabase,
      profile,
      enrollment.class_section_id,
    );

    const finalGrade = await calculateEnrollmentGrade(supabase, enrollment.id);

    if (!override && (finalGrade == null || finalGrade < 70)) {
      return jsonResponse(
        {
          error:
            "Completion requires a calculated final grade of at least 70%, unless override is enabled.",
          finalGrade,
        },
        400,
      );
    }

    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("enrollments")
      .update({
        status: "completed",
        current_grade: finalGrade,
        final_grade: finalGrade,
        completed_at: completedAt,
        completion_approved_by: profile.id,
      })
      .eq("id", enrollment.id);

    if (updateError) throw updateError;

    const levelBadge = await ensureBadge(supabase, {
      slug: `${enrollment.course.slug}-${enrollment.course_level.slug}-completion`,
      title: `${enrollment.course_level.title} Badge`,
      description: `Completed ${enrollment.course_level.title}.`,
      course_id: enrollment.course_id,
      course_level_id: enrollment.course_level_id,
      type: "level",
    });

    await awardBadge(
      supabase,
      enrollment.user_id,
      levelBadge.id,
      enrollment.id,
      profile.id,
    );

    await supabase.from("notifications").insert({
      user_id: enrollment.user_id,
      class_section_id: enrollment.class_section_id,
      type: "badge_earned",
      title: `Badge earned: ${levelBadge.title}`,
      body: `You completed ${enrollment.course_level.title}.`,
      created_by: profile.id,
    });

    const certificate = await maybeIssueCourseCertificate(
      supabase,
      enrollment,
      enrollment.course,
      enrollment.course_level,
      profile,
    );

    if (certificate) {
      await supabase.from("notifications").insert({
        user_id: enrollment.user_id,
        class_section_id: enrollment.class_section_id,
        type: "certificate_issued",
        title: "Certificate issued",
        body: `Certificate code: ${certificate.certificate_code}`,
        created_by: profile.id,
      });
    }

    return jsonResponse({
      status: "completed",
      finalGrade,
      badgeId: levelBadge.id,
      certificate,
    });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Unable to complete course level." },
      500,
    );
  }
}
