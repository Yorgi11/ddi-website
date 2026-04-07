import Stripe from "stripe";

export async function onRequestPost(context) {
  const stripe = new Stripe(context.env.STRIPE_SECRET_KEY);

  const { programId } = await context.request.json();

  const priceMap = {
    level1: "price_xxx",
    level2: "price_xxx",
    level3: "price_xxx",
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price: priceMap[programId],
        quantity: 1,
      },
    ],
    success_url: `${context.env.DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${context.env.DOMAIN}/checkout/${programId}`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { "Content-Type": "application/json" },
  });
}
