import { onRequestPost as createCheckoutSession } from "./functions/create-checkout-session.js";
import { onRequestPost as createPayPalOrder } from "./functions/create-paypal-order.js";
import { onRequestPost as registerAccount } from "./functions/register-account.js";
import { onRequestPost as sendAccountConfirmation } from "./functions/send-account-confirmation.js";
import { onRequestPost as verifyOnlinePayment } from "./functions/verify-online-payment.js";

const routes = {
  "/create-checkout-session": createCheckoutSession,
  "/create-paypal-order": createPayPalOrder,
  "/register-account": registerAccount,
  "/send-account-confirmation": sendAccountConfirmation,
  "/verify-online-payment": verifyOnlinePayment,
};

function methodNotAllowed() {
  return new Response(JSON.stringify({ error: "Method not allowed." }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const handler = routes[url.pathname];

    if (handler) {
      if (request.method !== "POST") {
        return methodNotAllowed();
      }

      return handler({ request, env, ctx });
    }

    return env.ASSETS.fetch(request);
  },
};
