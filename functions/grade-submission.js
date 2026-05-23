import { jsonResponse } from "./_payment-utils.js";
import {
  assertInstructorForSection,
  calculateAssignmentPercent,
  calculateEnrollmentGrade,
  getAuthedSupabase,
} from "./_lms-utils.js";

export async function onRequestPost(context) {
  try {
    const { supabase, profile } = await getAuthedSupabase(context);
    const { submissionId, pointsAwarded, feedback } =
      await context.request.json();

    if (!submissionId) {
      return jsonResponse({ error: "Missing submissionId." }, 400);
    }

    const { data: submission, error: submissionError } = await supabase
      .from("assignment_submissions")
      .select("*, assignment:assignments(*)")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return jsonResponse({ error: "Submission not found." }, 404);
    }

    await assertInstructorForSection(
      supabase,
      profile,
      submission.assignment.class_section_id,
    );

    const gradePercent = calculateAssignmentPercent(
      pointsAwarded,
      submission.assignment.points_possible,
    );

    if (gradePercent == null) {
      return jsonResponse({ error: "A valid point value is required." }, 400);
    }

    const { error: updateError } = await supabase
      .from("assignment_submissions")
      .update({
        points_awarded: Number(pointsAwarded),
        grade_percent: gradePercent,
        feedback: String(feedback || "").trim() || null,
        status: "graded",
        graded_by: profile.id,
        graded_at: new Date().toISOString(),
        returned_at: new Date().toISOString(),
      })
      .eq("id", submission.id);

    if (updateError) {
      throw updateError;
    }

    const { error: gradeError } = await supabase.from("grades").insert({
      enrollment_id: submission.enrollment_id,
      assignment_id: submission.assignment_id,
      assignment_submission_id: submission.id,
      grade_percent: gradePercent,
      points_awarded: Number(pointsAwarded),
      points_possible: Number(submission.assignment.points_possible),
      weight: Number(submission.assignment.weight ?? 1),
      feedback: String(feedback || "").trim() || null,
      graded_by: profile.id,
    });

    if (gradeError) {
      throw gradeError;
    }

    const currentGrade = await calculateEnrollmentGrade(
      supabase,
      submission.enrollment_id,
    );

    const { error: enrollmentError } = await supabase
      .from("enrollments")
      .update({
        current_grade: currentGrade,
        final_grade: currentGrade,
      })
      .eq("id", submission.enrollment_id);

    if (enrollmentError) {
      throw enrollmentError;
    }

    await supabase.from("notifications").insert({
      user_id: submission.user_id,
      class_section_id: submission.assignment.class_section_id,
      type: "grade_posted",
      title: `Grade posted: ${submission.assignment.title}`,
      body: `Your grade is ${gradePercent}%.`,
      created_by: profile.id,
    });

    return jsonResponse({
      status: "graded",
      gradePercent,
      currentGrade,
    });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Unable to grade submission." },
      500,
    );
  }
}
