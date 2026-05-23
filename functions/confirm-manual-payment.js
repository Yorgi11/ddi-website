import { confirmPayment, fetchPayment, jsonResponse } from "./_payment-utils.js";
import { getAuthedSupabase } from "./_lms-utils.js";

export async function onRequestPost(context) {
  try {
    const { supabase, user } = await getAuthedSupabase(context);
    const { paymentId, confirmationCode } = await context.request.json();

    if (!paymentId || !confirmationCode) {
      return jsonResponse(
        { error: "Missing paymentId or confirmationCode." },
        400,
      );
    }

    const payment = await fetchPayment(supabase, paymentId);

    if (payment.user_id !== user.id) {
      return jsonResponse({ error: "Payment not found." }, 404);
    }

    if (payment.payment_method !== "etransfer") {
      return jsonResponse(
        { error: "Manual confirmation is only available for e-Transfer." },
        400,
      );
    }

    if (payment.status === "confirmed") {
      return jsonResponse({ status: "confirmed" });
    }

    if (payment.confirmation_code !== String(confirmationCode).trim()) {
      return jsonResponse({ error: "Invalid confirmation code." }, 400);
    }

    await confirmPayment(supabase, payment);

    return jsonResponse({ status: "confirmed" });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Unable to confirm manual payment." },
      500,
    );
  }
}
