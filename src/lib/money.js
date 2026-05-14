export const TAX_RATE = 0.13;
export const STRIPE_FEE_RATE = 0.029;
export const STRIPE_FIXED_FEE = 0.3;
export const PAYPAL_FEE_RATE = 0.029;
export const PAYPAL_FIXED_FEE = 0.3;

export function calcTotals(basePrice, method) {
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

export function currency(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(value || 0);
}
