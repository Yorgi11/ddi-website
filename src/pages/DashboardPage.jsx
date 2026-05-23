import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import { useNavigate } from "react-router-dom";
import { buildStudentTimeline } from "../lib/studentTimeline";
import TimelineItem from "../components/TimelineItem";
import {
  fetchCourseCatalog,
  fetchStudentAchievements,
  fetchStudentEnrollments,
  fetchStudentNotifications,
} from "../lib/lmsApi";
import { getCurrentEnrollment, getVisibleCatalogCourses } from "../lib/lmsData";
import CurrentClassCard from "../components/dashboard/CurrentClassCard";
import EnrolledCourseCard from "../components/dashboard/EnrolledCourseCard";
import LmsSummaryCard from "../components/dashboard/LmsSummaryCard";
import AchievementsCard from "../components/dashboard/AchievementsCard";
import NotificationsCard from "../components/dashboard/NotificationsCard";

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [badges, setBadges] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [message, setMessage] = useState("");

  const currentEnrollment = getCurrentEnrollment(enrollments);
  const catalogCourses = getVisibleCatalogCourses(courses, enrollments);

  async function loadDashboardData() {
    if (!user) return;

    const { data: paymentData, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!paymentError) {
      setPayments(paymentData ?? []);
    }

    const { enrollments: enrollmentData, error: enrollmentError } =
      await fetchStudentEnrollments(user.id);

    setEnrollments(enrollmentData);

    const { courses: courseData, error: catalogError } =
      await fetchCourseCatalog();

    setCourses(courseData);

    const {
      badges: badgeData,
      certificates: certificateData,
      error: achievementError,
    } = await fetchStudentAchievements(user.id);

    setBadges(badgeData);
    setCertificates(certificateData);

    const {
      notifications: notificationData,
      error: notificationError,
    } = await fetchStudentNotifications(user.id);

    setNotifications(notificationData);

    if (
      paymentError ||
      catalogError ||
      enrollmentError ||
      achievementError ||
      notificationError
    ) {
      setMessage("Some dashboard data could not be loaded.");
    }
  }
  const timelineItems = buildStudentTimeline(
    profile,
    payments,
    enrollments,
  );
  useEffect(() => {
    loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <PageContainer>
        <SectionCard title="Dashboard" description="Loading your dashboard.">
          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            Loading...
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <SectionCard
          title="Dashboard"
          description="You must be logged in to view this page."
        >
          <div className={va.spacing.sectionStack}>
            <div style={va.textStyles.bodyTextThin(va.colors.warningColor)}>
              Please log in first.
            </div>
            <PrimaryButton fullWidth onClick={() => navigate("/account")}>
              Go to Account
            </PrimaryButton>
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className={va.spacing.pageStack}>
        <SectionCard
          title="Student Dashboard"
          description="Your account, progress, and payments in one place."
        >
          <div
            className={va.layout.infoList}
            style={{ color: va.colors.primaryTextDark }}
          >
            <div>Username: {profile?.username ?? "..."}</div>
            <div>Email: {user.email}</div>
            <div>LMS Enrollments: {enrollments.length}</div>
            <div>Course Path Level: {profile?.current_level ?? 1}</div>
          </div>
        </SectionCard>
        <LmsSummaryCard enrollments={enrollments} />
        <CurrentClassCard enrollment={currentEnrollment} />
        <NotificationsCard
          notifications={notifications}
          onChanged={loadDashboardData}
        />
        <SectionCard
          title="Enrolled Courses"
          description="Your active DDI LMS courses and class sections."
        >
          <div className={va.layout.infoList}>
            {enrollments.length > 0 ? (
              enrollments.slice(0, 3).map((enrollment) => (
                <EnrolledCourseCard
                  key={enrollment.id}
                  enrollment={enrollment}
                />
              ))
            ) : (
              <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
                No LMS enrollments yet. Apply the LMS migration and create class
                sections to populate this area.
              </div>
            )}
            <PrimaryButton fullWidth onClick={() => navigate("/dashboard/courses")}>
              View All Courses
            </PrimaryButton>
          </div>
        </SectionCard>
        <SectionCard
          title="Course Catalog"
          description="DDI course tracks visible in the LMS foundation."
        >
          <div className={va.layout.courseGrid}>
            {catalogCourses.slice(0, 3).map((course) => (
              <EnrolledCourseCard key={course.id} course={course} />
            ))}
          </div>
        </SectionCard>
        <AchievementsCard badges={badges} certificates={certificates} />
        <SectionCard
          title="Progress Timeline"
          description="A timeline of your account, payments, and course progress."
        >
          <div className={va.layout.infoList}>
            {timelineItems.length > 0 ? (
              timelineItems.map((item, index) => (
                <TimelineItem
                  key={`${item.type}-${item.date}-${index}`}
                  item={item}
                />
              ))
            ) : (
              <div
                style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}
              >
                No progress events yet.
              </div>
            )}
          </div>
        </SectionCard>
        <SectionCard
          title="Payment History"
          description="Your recent payment records."
        >
          <div
            className={va.layout.infoList}
            style={{ color: va.colors.primaryTextDark }}
          >
            {payments.length > 0 ? (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className={va.panels.secondaryPanel}
                  style={{
                    backgroundColor: va.colors.surfaceColor,
                    borderColor: va.colors.borderColor,
                    padding: "12px",
                  }}
                >
                  <div>
                    Item:{" "}
                    {payment.course_id ||
                      payment.course_level_id ||
                      payment.class_section_id ||
                      "Course payment"}
                  </div>
                  <div>Total: ${Number(payment.total).toFixed(2)}</div>
                  <div>Method: {payment.payment_method}</div>
                  <div>Status: {payment.status}</div>
                  <div>Reference: {payment.reference_code || "N/A"}</div>
                </div>
              ))
            ) : (
              <div>No payments yet.</div>
            )}
          </div>
        </SectionCard>

        {message && (
          <SectionCard title="Notice">
            <div style={va.textStyles.bodyTextThin(va.colors.warningColor)}>
              {message}
            </div>
          </SectionCard>
        )}
      </div>
    </PageContainer>
  );
}
