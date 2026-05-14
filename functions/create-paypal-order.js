import {
  fetchPayment,
  getDomain,
  getSupabaseAdmin,
  jsonResponse,
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

export async function onRequestPost(context) {
  try {
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

    const accessToken = await getPayPalAccessToken(context.env);
    const response = await fetch(
      `${getPayPalBaseUrl(context.env)}/v2/checkout/orders`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "PayPal-Request-Id": `create-${payment.id}`,
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: payment.id,
              custom_id: payment.id,
              description: `Digital Development Institute - ${payment.program_id}`,
              amount: {
                currency_code: "CAD",
                value: toMoneyString(payment.total),
              },
            },
          ],
          payment_source: {
            paypal: {
              experience_context: {
                payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
                landing_page: "LOGIN",
                shipping_preference: "NO_SHIPPING",
                user_action: "PAY_NOW",
                return_url: `${domain}/payment-success?provider=paypal&payment_id=${payment.id}`,
                cancel_url: `${domain}/checkout/${payment.program_id}`,
              },
            },
          },
        }),
      },
    );

    const order = await response.json();

    if (!response.ok) {
      throw new Error(order.message || "Unable to create PayPal order.");
    }

    const approveUrl =
      order.links?.find((link) => link.rel === "payer-action")?.href ||
      order.links?.find((link) => link.rel === "approve")?.href;

    if (!approveUrl) {
      throw new Error("PayPal did not return an approval link.");
    }

    return jsonResponse({ url: approveUrl });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Unable to create PayPal order." },
      500,
    );
  }
}
