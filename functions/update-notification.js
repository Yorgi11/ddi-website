import { jsonResponse } from "./_payment-utils.js";
import { getAuthedSupabase } from "./_lms-utils.js";

export async function onRequestPost(context) {
  try {
    const { supabase, user } = await getAuthedSupabase(context);
    const { notificationId, read } = await context.request.json();

    if (!notificationId) {
      return jsonResponse({ error: "Missing notificationId." }, 400);
    }

    const { error } = await supabase
      .from("notifications")
      .update({
        read_at: read ? new Date().toISOString() : null,
      })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return jsonResponse({ status: read ? "read" : "unread" });
  } catch (error) {
    return jsonResponse(
      { error: error.message || "Unable to update notification." },
      500,
    );
  }
}
