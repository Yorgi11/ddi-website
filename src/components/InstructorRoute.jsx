import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageContainer from "./PageContainer";
import SectionCard from "./SectionCard";
import { visualAid as va } from "../config/visualAid";

export default function InstructorRoute({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <PageContainer>
        <SectionCard title="Loading" description="Checking instructor access.">
          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            Loading...
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  if (!user) {
    return <Navigate to="/account" replace />;
  }

  if (!profile?.is_admin && !profile?.is_instructor) {
    return (
      <PageContainer>
        <SectionCard
          title="Access Denied"
          description="You do not have permission to view this page."
        >
          <div style={va.textStyles.bodyTextThin(va.colors.warningColor)}>
            Instructor access is required.
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  return children;
}
