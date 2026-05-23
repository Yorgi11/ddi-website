import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { visualAid as va } from "../config/visualAid";
import { fetchClassWorkspace } from "../lib/lmsApi";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import ClassTabNav from "../components/classes/ClassTabNav";
import ClassHomeTab from "../components/classes/ClassHomeTab";
import ClassWorkTab from "../components/classes/ClassWorkTab";
import ClassPostsTab from "../components/classes/ClassPostsTab";

export default function ClassPage() {
  const { classSectionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [workspace, setWorkspace] = useState({
    enrollment: null,
    assignments: [],
    submissions: [],
    posts: [],
    scheduleEvents: [],
    error: null,
  });

  async function loadWorkspace() {
    const data = await fetchClassWorkspace(user?.id, classSectionId);
    setWorkspace(data);
  }

  useEffect(() => {
    loadWorkspace();
  }, [user, classSectionId]);

  if (workspace.error) {
    return (
      <PageContainer>
        <SectionCard
          title="Class Workspace"
          description="This class workspace could not be loaded."
        >
          <div className={va.spacing.sectionStack}>
            <div style={va.textStyles.bodyTextThin(va.colors.warningColor)}>
              LMS class tables are not available yet, or this account does not
              have access to the requested class section.
            </div>
            <PrimaryButton fullWidth onClick={() => navigate("/dashboard/courses")}>
              Back to Enrolled Courses
            </PrimaryButton>
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  if (!workspace.enrollment) {
    return (
      <PageContainer>
        <SectionCard title="Class Not Found">
          <div className={va.spacing.sectionStack}>
            <div style={va.textStyles.bodyTextThin(va.colors.warningColor)}>
              No enrollment was found for this class section.
            </div>
            <PrimaryButton fullWidth onClick={() => navigate("/dashboard/courses")}>
              Back to Enrolled Courses
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
          title={workspace.enrollment.section.title}
          description={`${workspace.enrollment.course.title} / ${workspace.enrollment.level.title}`}
        >
          <ClassTabNav activeTab={activeTab} onChange={setActiveTab} />
        </SectionCard>

        {activeTab === "home" && (
          <ClassHomeTab
            enrollment={workspace.enrollment}
            scheduleEvents={workspace.scheduleEvents}
          />
        )}
        {activeTab === "classwork" && (
          <ClassWorkTab
            enrollment={workspace.enrollment}
            assignments={workspace.assignments}
            submissions={workspace.submissions}
            onSubmitted={loadWorkspace}
          />
        )}
        {activeTab === "posts" && <ClassPostsTab posts={workspace.posts} />}
      </div>
    </PageContainer>
  );
}
