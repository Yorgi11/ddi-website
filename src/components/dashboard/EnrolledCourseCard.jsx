import { useNavigate } from "react-router-dom";
import { visualAid as va } from "../../config/visualAid";
import PrimaryButton from "../PrimaryButton";
import SecondaryButton from "../SecondaryButton";

function statusLabel(status) {
  return String(status ?? "not_enrolled").replaceAll("_", " ");
}

export default function EnrolledCourseCard({ enrollment, course }) {
  const navigate = useNavigate();
  const isEnrollment = Boolean(enrollment);
  const courseData = enrollment?.course ?? course;
  const level = enrollment?.level;
  const section = enrollment?.section;
  const progress = course?.progress;

  return (
    <div
      className={va.panels.primaryPanel}
      style={{
        backgroundColor: va.colors.surfaceColor,
        borderColor: va.colors.borderColor,
        color: va.colors.primaryText,
        padding: "16px",
      }}
    >
      <div className={va.spacing.sectionStack}>
        <div>
          <div className={va.text.cardTitleFont}>{courseData.title}</div>
          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            {isEnrollment
              ? `${level?.title ?? "Class level"} / ${section?.title ?? "Section"}`
              : courseData.summary}
          </div>
        </div>

        {isEnrollment ? (
          <>
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              Status: {statusLabel(enrollment.status)}
            </div>
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              Current final grade:{" "}
              {enrollment.currentGrade == null
                ? "Not graded yet"
                : `${Number(enrollment.currentGrade).toFixed(1)}%`}
            </div>
            <PrimaryButton
              fullWidth
              onClick={() =>
                navigate(
                  `/dashboard/courses/${courseData.id}/classes/${section.id}`,
                )
              }
            >
              Continue Course
            </PrimaryButton>
          </>
        ) : (
          <>
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              Certificate: {courseData.certificateTitle}
            </div>
            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              Progress: {progress?.completed ?? 0} / {progress?.total ?? 0}{" "}
              levels completed
            </div>
            <SecondaryButton
              fullWidth
              onClick={() => navigate(`/dashboard/courses/${courseData.id}`)}
            >
              View Course
            </SecondaryButton>
          </>
        )}
      </div>
    </div>
  );
}
