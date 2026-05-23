import {
  getAuthedSupabase,
} from "./_lms-utils.js";
import { jsonResponse } from "./_payment-utils.js";

const TAX_RATE = 0.13;
const STRIPE_FEE_RATE = 0.029;
const STRIPE_FIXED_FEE = 0.3;
const PAYPAL_FEE_RATE = 0.029;
const PAYPAL_FIXED_FEE = 0.3;

function calcTotals(basePrice, method) {
  const subtotal = Number(basePrice || 0);
  const tax = subtotal * TAX_RATE;
  const standardTotal = subtotal + tax;

  if (method === "stripe" || method === "paypal") {
    const feeRate = method === "paypal" ? PAYPAL_FEE_RATE : STRIPE_FEE_RATE;
    const fixedFee =
      method === "paypal" ? PAYPAL_FIXED_FEE : STRIPE_FIXED_FEE;
    const methodFee = standardTotal * feeRate + fixedFee;
    return {
      subtotal,
      tax,
      methodFee,
      total: standardTotal + methodFee,
    };
  }

  return {
    subtotal,
    tax,
    methodFee: 0,
    total: standardTotal,
  };
}

function generateReferenceCode(classSectionId, userId) {
  const shortClass = String(classSectionId).replaceAll("-", "").slice(0, 8);
  const shortUser = String(userId).replaceAll("-", "").slice(0, 6);
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `DDI-CLASS-${shortClass}-${shortUser}-${randomPart}`;
}

function generateConfirmationCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function onRequestPost(context) {
  try {
    const { supabase, user } = await getAuthedSupabase(context);
    const {
      classSectionId,
      paymentMethod,
      firstName,
      lastName,
      email,
      username,
    } = await context.request.json();

    if (!classSectionId) {
      return jsonResponse({ error: "Missing classSectionId." }, 400);
    }

    if (!["etransfer", "stripe", "paypal"].includes(paymentMethod)) {
      return jsonResponse({ error: "Unsupported payment method." }, 400);
    }

    if (!firstName || !lastName || !email || !username) {
      return jsonResponse({ error: "Buyer information is required." }, 400);
    }

    const { data: section, error: sectionError } = await supabase
      .from("class_sections")
      .select(
        `
        *,
        course:courses(*),
        course_level:course_levels(*)
      `,
      )
      .eq("id", classSectionId)
      .single();

    if (sectionError || !section) {
      return jsonResponse({ error: "Class section not found." }, 404);
    }

    if (section.status !== "open") {
      return jsonResponse(
        { error: "This class section is not open for enrollment." },
        400,
      );
    }

    const { data: existingEnrollment, error: existingError } = await supabase
      .from("enrollments")
      .select("*")
      .eq("user_id", user.id)
      .eq("class_section_id", section.id)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    let enrollment = existingEnrollment;

    if (!enrollment) {
      const { data, error } = await supabase
        .from("enrollments")
        .insert({
          user_id: user.id,
          course_id: section.course_id,
          course_level_id: section.course_level_id,
          class_section_id: section.id,
          status: "pending_payment",
        })
        .select()
        .single();

      if (error) throw error;
      enrollment = data;
    }

    if (["paid", "enrolled", "in_progress", "completed"].includes(enrollment.status)) {
      return jsonResponse(
        { error: "You are already enrolled in this class section." },
        400,
      );
    }

    const totals = calcTotals(Number(section.price_cents || 0) / 100, paymentMethod);
    const isETransfer = paymentMethod === "etransfer";

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        course_id: section.course_id,
        course_level_id: section.course_level_id,
        class_section_id: section.id,
        enrollment_id: enrollment.id,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        payment_method: paymentMethod,
        reference_code: isETransfer
          ? generateReferenceCode(section.id, user.id)
          : null,
        confirmation_code: isETransfer ? generateConfirmationCode() : null,
        status: "pending",
        first_name: String(firstName).trim(),
        last_name: String(lastName).trim(),
        email: String(email).trim(),
        username: String(username).trim(),
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    return jsonResponse({
      paymentId: payment.id,
      enrollmentId: enrollment.id,
      classSectionId: section.id,
      paymentMethod,
    });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Unable to create class checkout." },
      500,
    );
  }
}
