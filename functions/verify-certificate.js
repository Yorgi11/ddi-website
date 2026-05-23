import { getSupabaseAdmin, jsonResponse } from "./_payment-utils.js";

export async function onRequestGet(context) {
  try {
    const supabase = getSupabaseAdmin(context.env);
    const url = new URL(context.request.url);
    const certificateCode = url.searchParams.get("code");

    if (!certificateCode) {
      return jsonResponse({ error: "Missing certificate code." }, 400);
    }

    const { data, error } = await supabase
      .from("certificates")
      .select(
        `
        certificate_title,
        certificate_code,
        certificate_text,
        issued_at,
        revoked_at,
        course:courses(title,slug),
        student:profiles(username,email)
      `,
      )
      .eq("certificate_code", certificateCode.trim())
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data || data.revoked_at) {
      return jsonResponse({ valid: false }, 404);
    }

    return jsonResponse({
      valid: true,
      certificate: {
        title: data.certificate_title,
        code: data.certificate_code,
        text: data.certificate_text,
        issuedAt: data.issued_at,
        courseTitle: data.course?.title ?? "Course",
        studentName: data.student?.username || data.student?.email || "Student",
      },
    });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Unable to verify certificate." },
      500,
    );
  }
}
