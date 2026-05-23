import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { visualAid as va } from "../config/visualAid";
import {
  fetchCourseCatalogItem,
  fetchOpenClassSections,
  fetchStudentEnrollments,
} from "../lib/lmsApi";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import EnrolledCourseCard from "../components/dashboard/EnrolledCourseCard";
import PrimaryButton from "../components/PrimaryButton";

export default function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [openSections, setOpenSections] = useState([]);
  const [sectionMessage, setSectionMessage] = useState("");

  useEffect(() => {
    async function loadCourse() {
      setLoadingCourse(true);
      const [courseResult, enrollmentResult, sectionResult] = await Promise.all([
        fetchCourseCatalogItem(courseId),
        fetchStudentEnrollments(user?.id),
        fetchOpenClassSections(courseId),
      ]);

      setCourse(courseResult.course);
      setLoadingCourse(false);
      setEnrollments(enrollmentResult.enrollments);
      setOpenSections(sectionResult.sections);
      setSectionMessage(
        courseResult.error || sectionResult.error
          ? "Course details could not be loaded."
          : "",
      );
    }

    loadCourse();
  }, [user, courseId]);

  if (loadingCourse) {
    return (
      <PageContainer>
        <SectionCard title="Loading Course">
          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            Loading course details...
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  if (!course) {
    return (
      <PageContainer>
        <SectionCard title="Course Not Found">
          <div style={va.textStyles.bodyTextThin(va.colors.warningColor)}>
            This course does not exist in the current course catalog.
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  const courseEnrollments = enrollments.filter(
    (enrollment) => enrollment.course.id === course.id,
  );
  const completedLevelIds = new Set(
    courseEnrollments
      .filter((enrollment) => enrollment.status === "completed")
      .map((enrollment) => enrollment.level.id),
  );

  return (
    <PageContainer>
      <div className={va.spacing.pageStack}>
        <SectionCard title={course.title} description={course.summary}>
          <div className={va.layout.infoList}>
            <div>Certificate: {course.certificateTitle}</div>
            <div>
              Completed: {completedLevelIds.size} / {course.levels.length}{" "}
              levels
            </div>
          </div>
        </SectionCard>

        {courseEnrollments.length > 0 && (
          <SectionCard
            title="Current Classes"
            description="Class sections attached to your account."
          >
            <div className={va.layout.infoList}>
              {courseEnrollments.map((enrollment) => (
                <EnrolledCourseCard
                  key={enrollment.id}
                  enrollment={enrollment}
                />
              ))}
            </div>
          </SectionCard>
        )}

        <SectionCard
          title="Open Class Sections"
          description="Enroll in a scheduled DDI class section."
        >
          <div className={va.layout.infoList}>
            {openSections.length > 0 ? (
              openSections.map((section) => (
                <div
                  key={section.id}
                  className={va.panels.secondaryPanel}
                  style={{ borderColor: va.colors.borderColor, padding: "12px" }}
                >
                  <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                    {section.title}
                  </div>
                  <div
                    style={va.textStyles.bodyTextThin(
                      va.colors.primaryTextDark,
                    )}
                  >
                    Level {section.course_level?.level_number}:{" "}
                    {section.course_level?.title}
                  </div>
                  <div
                    style={va.textStyles.bodyTextThin(
                      va.colors.primaryTextDark,
                    )}
                  >
                    Delivery: {section.delivery_mode}
                  </div>
                  <div
                    style={va.textStyles.bodyTextThin(
                      va.colors.primaryTextDark,
                    )}
                  >
                    Price: ${(Number(section.price_cents || 0) / 100).toFixed(2)}
                  </div>
                  <div className={va.spacing.marginTopMedium}>
                    <PrimaryButton
                      fullWidth
                      onClick={() => navigate(`/checkout/class/${section.id}`)}
                    >
                      Enroll in Class
                    </PrimaryButton>
                  </div>
                </div>
              ))
            ) : (
              <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                {sectionMessage || "No class sections are open right now."}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Course Levels"
          description="Future levels stay visible and locked until requirements are met."
        >
          <div className={va.layout.infoList}>
            {course.levels.map((level) => {
              const matchingEnrollment = courseEnrollments.find(
                (enrollment) => enrollment.level.id === level.id,
              );
              const completed = completedLevelIds.has(level.id);
              const previousComplete =
                !level.prerequisiteLevelId ||
                completedLevelIds.has(level.prerequisiteLevelId);
              const status = completed
                ? "Completed"
                : matchingEnrollment
                  ? matchingEnrollment.status
                  : previousComplete
                    ? "Available when a class section opens"
                    : "Locked";

              return (
                <div
                  key={level.id}
                  className={va.panels.secondaryPanel}
                  style={{ borderColor: va.colors.borderColor, padding: "12px" }}
                >
                  <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                    Level {level.levelNumber}: {level.title}
                  </div>
                  <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                    {level.summary}
                  </div>
                  <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                    Status: {status}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
