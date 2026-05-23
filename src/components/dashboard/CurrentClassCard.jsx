import { useNavigate } from "react-router-dom";
import { visualAid as va } from "../../config/visualAid";
import SectionCard from "../SectionCard";
import PrimaryButton from "../PrimaryButton";
import SecondaryButton from "../SecondaryButton";

function formatDate(value) {
  if (!value) return "No scheduled class yet";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function CurrentClassCard({ enrollment }) {
  const navigate = useNavigate();

  if (!enrollment) {
    return (
      <SectionCard
        title="Continue Current Class"
        description="No active class is attached to this account yet."
      >
        <div className={va.spacing.sectionStack}>
          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            Enrolled LMS classes will appear here after a class section is
            assigned or an enrollment payment is confirmed.
          </div>
          <SecondaryButton
            fullWidth
            onClick={() => navigate("/dashboard/courses")}
          >
            View Course Catalog
          </SecondaryButton>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Continue Current Class"
      description={`${enrollment.course.title} / ${enrollment.level.title}`}
    >
      <div className={va.spacing.sectionStack}>
        <div style={va.textStyles.bodyText(va.colors.primaryText)}>
          {enrollment.section.title}
        </div>
        <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
          Next session: {formatDate(enrollment.section.startsAt)}
        </div>
        <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
          Current grade:{" "}
          {enrollment.currentGrade == null
            ? "Not graded yet"
            : `${Number(enrollment.currentGrade).toFixed(1)}%`}
        </div>
        <PrimaryButton
          fullWidth
          onClick={() =>
            navigate(
              `/dashboard/courses/${enrollment.course.id}/classes/${enrollment.section.id}`,
            )
          }
        >
          Open Class
        </PrimaryButton>
      </div>
    </SectionCard>
  );
}
