import { createClient } from "@supabase/supabase-js";

export const DEFAULT_PUBLIC_CONFIG = {
  brevoSenderEmail: "ddi@digitaldevinstitute.com",
  brevoSenderName: "Digital Development Institute",
  domain: "https://digitaldevinstitute.com",
  paypalClientId:
    "AUtcPwklZ8siEqJrAQG6cEn-o1Vg83zG8IHIKu75gORyTpyyda3AT-kmCQiP81ED6iUF_7irnh3G3E3Q",
  paypalEnvironment: "live",
  supabaseUrl: "https://megtizlllbygpglzhpik.supabase.co",
};

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function getBrevoSender(env) {
  return {
    email: env.BREVO_SENDER_EMAIL || DEFAULT_PUBLIC_CONFIG.brevoSenderEmail,
    name: env.BREVO_SENDER_NAME || DEFAULT_PUBLIC_CONFIG.brevoSenderName,
  };
}

export function getSupabaseAdmin(env) {
  const supabaseUrl =
    env.SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    DEFAULT_PUBLIC_CONFIG.supabaseUrl;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

export function getDomain(env, request) {
  const configuredDomain =
    env.DOMAIN || env.SITE_URL || DEFAULT_PUBLIC_CONFIG.domain;

  if (configuredDomain) {
    return configuredDomain.replace(/\/$/, "");
  }

  return new URL(request.url).origin;
}

export function toCents(value) {
  return Math.round(Number(value || 0) * 100);
}

export function toMoneyString(value) {
  return Number(value || 0).toFixed(2);
}

export async function fetchPayment(supabase, paymentId) {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Payment not found.");
  }

  return data;
}

export async function confirmPayment(supabase, payment, updates = {}) {
  const { error: paymentError } = await supabase
    .from("payments")
    .update({
      status: "confirmed",
      ...updates,
    })
    .eq("id", payment.id);

  if (paymentError) {
    throw paymentError;
  }

  if (payment.enrollment_id) {
    const { error: enrollmentError } = await supabase
      .from("enrollments")
      .update({
        status: "enrolled",
      })
      .eq("id", payment.enrollment_id);

    if (enrollmentError) {
      throw enrollmentError;
    }

    return;
  }
}
