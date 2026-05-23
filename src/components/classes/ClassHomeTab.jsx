import { visualAid as va } from "../../config/visualAid";
import SectionCard from "../SectionCard";

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ClassHomeTab({ enrollment, scheduleEvents }) {
  return (
    <div className={va.spacing.pageStack}>
      <SectionCard
        title="Class Home"
        description={enrollment.level.summary || "Class overview and syllabus."}
      >
        <div className={va.layout.infoList}>
          <div>Course: {enrollment.course.title}</div>
          <div>Class: {enrollment.level.title}</div>
          <div>Section: {enrollment.section.title}</div>
          <div>Delivery: {enrollment.section.deliveryMode}</div>
          <div>Next Session: {formatDate(enrollment.section.startsAt)}</div>
        </div>
      </SectionCard>

      <SectionCard title="Schedule" description="Upcoming DDI schedule events.">
        <div className={va.layout.infoList}>
          {scheduleEvents.length > 0 ? (
            scheduleEvents.map((event) => (
              <div
                key={event.id}
                className={va.panels.secondaryPanel}
                style={{ borderColor: va.colors.borderColor, padding: "12px" }}
              >
                <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                  {event.title}
                </div>
                <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                  {formatDate(event.starts_at)}
                </div>
              </div>
            ))
          ) : (
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              No schedule events have been posted yet.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
