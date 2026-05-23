import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { visualAid as va } from "../config/visualAid";
import { fetchCourseCatalog, fetchStudentEnrollments } from "../lib/lmsApi";
import { getVisibleCatalogCourses } from "../lib/lmsData";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import EnrolledCourseCard from "../components/dashboard/EnrolledCourseCard";

export default function EnrolledCoursesPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCourses() {
      const [enrollmentResult, catalogResult] = await Promise.all([
        fetchStudentEnrollments(user?.id),
        fetchCourseCatalog(),
      ]);

      setEnrollments(enrollmentResult.enrollments);
      setCourses(catalogResult.courses);
      setMessage(
        enrollmentResult.error || catalogResult.error
          ? "LMS course data is not available yet. Apply the LMS database migration to enable live courses."
          : "",
      );
    }

    loadCourses();
  }, [user]);

  const catalogCourses = getVisibleCatalogCourses(courses, enrollments);

  return (
    <PageContainer>
      <div className={va.spacing.pageStack}>
        <SectionCard
          title="Enrolled Courses"
          description="Your active DDI course tracks and available LMS pathways."
        >
          <div className={va.layout.infoList}>
            {enrollments.length > 0 ? (
              enrollments.map((enrollment) => (
                <EnrolledCourseCard
                  key={enrollment.id}
                  enrollment={enrollment}
                />
              ))
            ) : (
              <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                You are not enrolled in an LMS class section yet.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Course Catalog"
          description="Future course tracks are visible here while class sections are created."
        >
          <div className={va.layout.courseGrid}>
            {catalogCourses.map((course) => (
              <EnrolledCourseCard key={course.id} course={course} />
            ))}
          </div>
        </SectionCard>

        {message && (
          <SectionCard title="LMS Notice">
            <div style={va.textStyles.bodyTextThin(va.colors.warningColor)}>
              {message}
            </div>
          </SectionCard>
        )}
      </div>
    </PageContainer>
  );
}
