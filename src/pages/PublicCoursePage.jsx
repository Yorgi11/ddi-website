import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCourseCatalogItem, fetchOpenClassSections } from "../lib/lmsApi";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";
import ExpandableDetails from "../components/ExpandableDetails";

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function PublicCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [openSections, setOpenSections] = useState([]);
  const [courseExpanded, setCourseExpanded] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState(new Set());
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCourse() {
      setLoadingCourse(true);
      const [courseResult, sectionResult] = await Promise.all([
        fetchCourseCatalogItem(courseId),
        fetchOpenClassSections(courseId),
      ]);

      setCourse(courseResult.course);
      setLoadingCourse(false);
      setOpenSections(sectionResult.sections);
      setMessage(
        courseResult.error || sectionResult.error
          ? "Course details could not be loaded."
          : "",
      );
    }

    loadCourse();
  }, [courseId]);

  function toggleSetItem(setter, itemId) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

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

  if (!course && !loadingCourse) {
    return (
      <PageContainer>
        <SectionCard title="Course Not Found">
          <div style={va.textStyles.bodyTextThin(va.colors.warningColor)}>
            This course is not currently available.
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className={va.spacing.pageStack}>
        <SectionCard title={course.title} description={course.summary}>
          <div className={va.layout.infoList}>
            <div>Certificate: {course.certificateTitle}</div>
            <div>Levels: {course.levels.length}</div>
            <div>
              LMS: Materials, assignments, grades, instructor posts, badges, and
              certificates are managed through the DDI Student Dashboard.
            </div>
            {(course.description || course.summary) && (
              <ExpandableDetails
                expanded={courseExpanded}
                onToggle={() => setCourseExpanded((current) => !current)}
                label="course details"
              >
                <div>{course.description || course.summary}</div>
              </ExpandableDetails>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Course Levels"
          description="Each level builds toward the final course certificate."
        >
          <div className={va.layout.infoList}>
            {course.levels.map((level) => (
              <div
                key={level.id}
                className={va.panels.secondaryPanel}
                style={{ borderColor: va.colors.borderColor, padding: "12px" }}
              >
                <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                  Level {level.levelNumber}: {level.title}
                </div>
                <div
                  style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}
                >
                  {level.summary}
                </div>
                {(level.description || level.syllabus) && (
                  <div className={va.spacing.marginTopMedium}>
                    <ExpandableDetails
                      expanded={expandedLevels.has(level.id)}
                      onToggle={() => toggleSetItem(setExpandedLevels, level.id)}
                      label="level details"
                    >
                      {level.description && (
                        <div>
                          <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                            Description
                          </div>
                          <div>{level.description}</div>
                        </div>
                      )}
                      {level.syllabus && (
                        <div>
                          <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                            Syllabus
                          </div>
                          <div>{level.syllabus}</div>
                        </div>
                      )}
                    </ExpandableDetails>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Open Class Sections"
          description="Choose a scheduled class section to enroll."
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
                    Starts: {formatDate(section.starts_at)} / Delivery:{" "}
                    {section.delivery_mode}
                  </div>
                  <div
                    style={va.textStyles.bodyTextThin(
                      va.colors.primaryTextDark,
                    )}
                  >
                    Price: ${(Number(section.price_cents || 0) / 100).toFixed(2)}
                  </div>
                  <div className={va.spacing.marginTopMedium}>
                    <ExpandableDetails
                      expanded={expandedSections.has(section.id)}
                      onToggle={() =>
                        toggleSetItem(setExpandedSections, section.id)
                      }
                      label="section details"
                    >
                      <div>Ends: {formatDate(section.ends_at)}</div>
                      <div>
                        Enrollment closes:{" "}
                        {formatDate(section.enrollment_closes_at)}
                      </div>
                      <div>Capacity: {section.capacity ?? "Not limited"}</div>
                      <div>Location: {section.location || "Not set"}</div>
                      <div>Meeting URL: {section.meeting_url || "Not set"}</div>
                      {section.course_level?.description && (
                        <div>
                          <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                            Level Description
                          </div>
                          <div>{section.course_level.description}</div>
                        </div>
                      )}
                      {section.course_level?.syllabus && (
                        <div>
                          <div style={va.textStyles.bodyText(va.colors.primaryText)}>
                            Syllabus
                          </div>
                          <div>{section.course_level.syllabus}</div>
                        </div>
                      )}
                    </ExpandableDetails>
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
                {message || "No class sections are open right now."}
              </div>
            )}
          </div>
        </SectionCard>

        <SecondaryButton fullWidth onClick={() => navigate("/courses")}>
          Back to Courses
        </SecondaryButton>
      </div>
    </PageContainer>
  );
}
