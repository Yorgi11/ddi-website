import Stripe from "stripe";
import {
  confirmPayment,
  fetchPayment,
  getSupabaseAdmin,
  jsonResponse,
  toCents,
  toMoneyString,
} from "./_payment-utils.js";

function getPayPalBaseUrl(env) {
  return env.PAYPAL_ENVIRONMENT === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken(env) {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET.");
  }

  const credentials = btoa(
    `${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`,
  );

  const response = await fetch(`${getPayPalBaseUrl(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || "Unable to authorize PayPal.");
  }

  return data.access_token;
}

async function verifyStripe(context, supabase, payment, sessionId) {
  if (!sessionId) {
    throw new Error("Missing Stripe session id.");
  }

  if (!context.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  const stripe = new Stripe(context.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new Error("Stripe payment is not paid.");
  }

  if (session.metadata?.payment_id !== payment.id) {
    throw new Error("Stripe session does not match this payment.");
  }

  if (session.amount_total !== toCents(payment.total)) {
    throw new Error("Stripe payment amount does not match this checkout.");
  }

  await confirmPayment(supabase, payment, {
    payment_method: "stripe",
  });
}

async function verifyPayPal(context, supabase, payment, orderId) {
  if (!orderId) {
    throw new Error("Missing PayPal order id.");
  }

  const accessToken = await getPayPalAccessToken(context.env);
  const response = await fetch(
    `${getPayPalBaseUrl(context.env)}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `capture-${orderId}`,
      },
    },
  );

  const capture = await response.json();

  if (!response.ok && capture.name !== "ORDER_ALREADY_CAPTURED") {
    throw new Error(capture.message || "Unable to capture PayPal payment.");
  }

  const purchaseUnit = capture.purchase_units?.[0];
  const capturedPayment = purchaseUnit?.payments?.captures?.[0];

  if (
    capture.status !== "COMPLETED" &&
    capturedPayment?.status !== "COMPLETED" &&
    capture.name !== "ORDER_ALREADY_CAPTURED"
  ) {
    throw new Error("PayPal payment is not complete.");
  }

  if (purchaseUnit?.reference_id && purchaseUnit.reference_id !== payment.id) {
    throw new Error("PayPal order does not match this payment.");
  }

  const paidAmount = capturedPayment?.amount?.value;

  if (paidAmount && paidAmount !== toMoneyString(payment.total)) {
    throw new Error("PayPal payment amount does not match this checkout.");
  }

  await confirmPayment(supabase, payment, {
    payment_method: "paypal",
  });
}

export async function onRequestPost(context) {
  try {
    const supabase = getSupabaseAdmin(context.env);
    const { provider, paymentId, sessionId, orderId } =
      await context.request.json();

    if (!provider || !paymentId) {
      return jsonResponse({ error: "Missing provider or paymentId." }, 400);
    }

    const payment = await fetchPayment(supabase, paymentId);

    if (payment.status === "confirmed") {
      return jsonResponse({ status: "confirmed" });
    }

    if (provider === "stripe") {
      await verifyStripe(context, supabase, payment, sessionId);
    } else if (provider === "paypal") {
      await verifyPayPal(context, supabase, payment, orderId);
    } else {
      return jsonResponse({ error: "Unsupported payment provider." }, 400);
    }

    return jsonResponse({ status: "confirmed" });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Unable to verify online payment." },
      500,
    );
  }
}
