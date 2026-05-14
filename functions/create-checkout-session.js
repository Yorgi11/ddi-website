import Stripe from "stripe";
import {
  fetchPayment,
  getDomain,
  getSupabaseAdmin,
  jsonResponse,
  toCents,
} from "./_payment-utils.js";

export async function onRequestPost(context) {
  try {
    if (!context.env.STRIPE_SECRET_KEY) {
      return jsonResponse({ error: "Missing STRIPE_SECRET_KEY." }, 500);
    }

    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY);
    const supabase = getSupabaseAdmin(context.env);
    const domain = getDomain(context.env, context.request);
    const { paymentId } = await context.request.json();

    if (!paymentId) {
      return jsonResponse({ error: "Missing paymentId." }, 400);
    }

    const payment = await fetchPayment(supabase, paymentId);

    if (payment.status === "confirmed") {
      return jsonResponse({ error: "Payment is already confirmed." }, 400);
    }

    const buyerEmail = payment.email || undefined;
    const buyerName = [payment.first_name, payment.last_name]
      .filter(Boolean)
      .join(" ");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: buyerEmail,
      client_reference_id: payment.id,
      metadata: {
        payment_id: payment.id,
        user_id: payment.user_id,
        program_id: payment.program_id,
      },
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: `Digital Development Institute - ${payment.program_id}`,
              description: buyerName || undefined,
            },
            unit_amount: toCents(payment.total),
          },
          quantity: 1,
        },
      ],
      success_url: `${domain}/payment-success?provider=stripe&payment_id=${payment.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/checkout/${payment.program_id}`,
    });

    return jsonResponse({ url: session.url });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Unable to create checkout session." },
      500,
    );
  }
}
