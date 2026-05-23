import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCourseCatalog } from "../lib/lmsApi";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";

export default function PublicCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCourses() {
      const { courses: courseData, error } = await fetchCourseCatalog();
      setCourses(courseData);
      setMessage(error ? "Course catalog could not be loaded." : "");
    }

    loadCourses();
  }, []);

  return (
    <PageContainer>
      <div className={va.spacing.pageStack}>
        <SectionCard
          title="Courses"
          description="DDI course tracks are managed through the DDI Student Dashboard, including class materials, assignments, grades, badges, and certificates."
        >
          <div className={va.layout.courseGrid}>
            {courses.length > 0 ? (
              courses.map((course) => (
                <div
                  key={course.id}
                  className={va.panels.secondaryPanel}
                  style={{
                    borderColor: va.colors.borderColor,
                    padding: "16px",
                  }}
                >
                  <div className={va.spacing.sectionStack}>
                    <div>
                      <div className={va.text.cardTitleFont}>{course.title}</div>
                      <div
                        style={va.textStyles.bodyTextThin(
                          va.colors.primaryTextDark,
                        )}
                      >
                        {course.summary}
                      </div>
                    </div>
                    <div
                      style={va.textStyles.bodyTextThin(
                        va.colors.primaryTextDark,
                      )}
                    >
                      {course.levels.length} levels / {course.certificateTitle}
                    </div>
                    <PrimaryButton
                      fullWidth
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      View Course
                    </PrimaryButton>
                  </div>
                </div>
              ))
            ) : (
              <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                {message || "No courses are published yet."}
              </div>
            )}
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
