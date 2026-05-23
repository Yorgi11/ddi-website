import { visualAid as va } from "../../config/visualAid";
import { supabase } from "../../lib/supabase";
import SectionCard from "../SectionCard";
import SecondaryButton from "../SecondaryButton";

function formatDate(value) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatType(type) {
  return String(type || "general").replaceAll("_", " ");
}

export default function NotificationsCard({ notifications, onChanged }) {
  async function updateNotification(notificationId, read) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) return;

    await fetch("/update-notification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        notificationId,
        read,
      }),
    });

    if (onChanged) {
      onChanged();
    }
  }

  return (
    <SectionCard
      title="Notifications"
      description="Recent class updates from DDI instructors."
    >
      <div className={va.layout.infoList}>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={va.panels.secondaryPanel}
              style={{
                borderColor: notification.read_at
                  ? va.colors.borderColor
                  : va.colors.primaryColor,
                padding: "12px",
              }}
            >
              <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                {notification.title}
              </div>
              <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                {formatType(notification.type)} /{" "}
                {notification.class_section?.title ?? "Class"} /{" "}
                {formatDate(notification.created_at)}
              </div>
              {notification.body && (
                <div
                  className={va.spacing.marginTopSmall}
                  style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}
                >
                  {notification.body}
                </div>
              )}
              <div className={va.spacing.marginTopMedium}>
                <SecondaryButton
                  fullWidth
                  onClick={() =>
                    updateNotification(notification.id, !notification.read_at)
                  }
                >
                  {notification.read_at ? "Mark Unread" : "Mark Read"}
                </SecondaryButton>
              </div>
            </div>
          ))
        ) : (
          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            No notifications yet.
          </div>
        )}
      </div>
    </SectionCard>
  );
}
