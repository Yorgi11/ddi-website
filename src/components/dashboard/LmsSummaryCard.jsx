import { visualAid as va } from "../../config/visualAid";
import SectionCard from "../SectionCard";

export default function LmsSummaryCard({ enrollments }) {
  const activeCount = enrollments.filter((item) =>
    ["paid", "enrolled", "in_progress"].includes(item.status),
  ).length;
  const completedCount = enrollments.filter(
    (item) => item.status === "completed",
  ).length;
  const graded = enrollments.filter((item) => item.currentGrade != null);
  const averageGrade =
    graded.length > 0
      ? graded.reduce((sum, item) => sum + Number(item.currentGrade), 0) /
        graded.length
      : null;

  return (
    <SectionCard
      title="LMS Overview"
      description="Your DDI classes, course progress, grades, badges, and certificates."
    >
      <div className="grid gap-3 md:grid-cols-3">
        <div
          className={`${va.panels.secondaryPanel} ${va.spacing.cardSpacing}`}
          style={{ borderColor: va.colors.borderColor }}
        >
          <div style={va.textStyles.bodyText(va.colors.primaryText)}>
            Active Classes
          </div>
          <div className={va.text.pageTitleFont}>{activeCount}</div>
        </div>
        <div
          className={`${va.panels.secondaryPanel} ${va.spacing.cardSpacing}`}
          style={{ borderColor: va.colors.borderColor }}
        >
          <div style={va.textStyles.bodyText(va.colors.primaryText)}>
            Completed Levels
          </div>
          <div className={va.text.pageTitleFont}>{completedCount}</div>
        </div>
        <div
          className={`${va.panels.secondaryPanel} ${va.spacing.cardSpacing}`}
          style={{ borderColor: va.colors.borderColor }}
        >
          <div style={va.textStyles.bodyText(va.colors.primaryText)}>
            Current Grade
          </div>
          <div className={va.text.pageTitleFont}>
            {averageGrade == null ? "--" : `${averageGrade.toFixed(1)}%`}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
