import { jsonResponse } from "./_payment-utils.js";
import {
  assertInstructorForSection,
  getAuthedSupabase,
} from "./_lms-utils.js";

const ALLOWED_TYPES = new Set([
  "assignment_due",
  "class_starting",
  "new_post",
  "grade_posted",
  "badge_earned",
  "certificate_issued",
  "general",
]);

export async function onRequestPost(context) {
  try {
    const { supabase, profile } = await getAuthedSupabase(context);
    const { classSectionId, type = "general", title, body } =
      await context.request.json();

    if (!classSectionId || !title) {
      return jsonResponse(
        { error: "classSectionId and title are required." },
        400,
      );
    }

    if (!ALLOWED_TYPES.has(type)) {
      return jsonResponse({ error: "Unsupported notification type." }, 400);
    }

    await assertInstructorForSection(supabase, profile, classSectionId);

    const { data: enrollments, error: enrollmentError } = await supabase
      .from("enrollments")
      .select("user_id")
      .eq("class_section_id", classSectionId)
      .in("status", ["paid", "enrolled", "in_progress", "completed"]);

    if (enrollmentError) {
      throw enrollmentError;
    }

    const rows = (enrollments ?? []).map((enrollment) => ({
      user_id: enrollment.user_id,
      class_section_id: classSectionId,
      type,
      title: String(title).trim(),
      body: String(body || "").trim() || null,
      created_by: profile.id,
    }));

    if (rows.length === 0) {
      return jsonResponse({ status: "no_recipients", count: 0 });
    }

    const { error } = await supabase.from("notifications").insert(rows);

    if (error) {
      throw error;
    }

    return jsonResponse({ status: "sent", count: rows.length });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Unable to send class notification." },
      500,
    );
  }
}
