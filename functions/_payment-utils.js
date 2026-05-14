import { createClient } from "@supabase/supabase-js";

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function getSupabaseAdmin(env) {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
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
  const configuredDomain = env.DOMAIN || env.SITE_URL;

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

function getDerivedCurrentLevel(profile) {
  if (!profile) return 1;

  const completed = profile.completed_levels ?? [];
  const placement = profile.placement_access ?? [];

  let level = 1;

  if (completed.includes("level1") || placement.includes("level2")) {
    level = Math.max(level, 2);
  }

  if (completed.includes("level2") || placement.includes("level3")) {
    level = Math.max(level, 3);
  }

  return level;
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

  const { data: profileData, error: profileFetchError } = await supabase
    .from("profiles")
    .select("levels_paid_for,current_level,completed_levels,placement_access")
    .eq("id", payment.user_id)
    .maybeSingle();

  if (profileFetchError) {
    throw profileFetchError;
  }

  const existingLevels = profileData?.levels_paid_for ?? [];
  const nextLevels = existingLevels.includes(payment.program_id)
    ? existingLevels
    : [...existingLevels, payment.program_id];

  const nextProfile = {
    ...profileData,
    levels_paid_for: nextLevels,
  };

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      levels_paid_for: nextLevels,
      current_level: getDerivedCurrentLevel(nextProfile),
    })
    .eq("id", payment.user_id);

  if (profileUpdateError) {
    throw profileUpdateError;
  }

  const { error: statusError } = await supabase.from("program_status").upsert(
    {
      user_id: payment.user_id,
      program_id: payment.program_id,
      status: "paid",
    },
    { onConflict: "user_id,program_id" },
  );

  if (statusError) {
    throw statusError;
  }
}
