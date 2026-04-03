import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { visualAid as va } from "../config/visualAid";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import { useNavigate } from "react-router-dom";
import { PROGRAMS } from "../data/programs";
import DashboardProgramCard from "../components/DashboardProgramCard";
import { buildStudentTimeline } from "../lib/studentTimeline";
import TimelineItem from "../components/TimelineItem";
import { getRecommendedAction } from "../lib/recommendedAction";
import { getPortalSummary } from "../lib/dashboardSummary";
import PortalSummaryCard from "../components/PortalSummaryCard";

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [programStatuses, setProgramStatuses] = useState([]);
  const [message, setMessage] = useState("");

  const recommendedAction = getRecommendedAction(profile, programStatuses);
  const portalSummary = getPortalSummary(profile, programStatuses);

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

    const { data: statusData, error: statusError } = await supabase
      .from("program_status")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (!statusError) {
      setProgramStatuses(statusData ?? []);
    }

    if (paymentError || statusError) {
      setMessage("Some dashboard data could not be loaded.");
    }
  }
  const timelineItems = buildStudentTimeline(
    profile,
    payments,
    programStatuses,
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
            <div>Current Level: {profile?.current_level ?? 1}</div>
            <div>
              Placement Access:{" "}
              {profile?.placement_access?.join(", ") || "None"}
            </div>
          </div>
        </SectionCard>
        <PortalSummaryCard summary={portalSummary} />
        <SectionCard
          title="Next Recommended Action"
          description="The best next step for your account right now."
        >
          <div className={va.spacing.sectionStack}>
            <div style={va.textStyles.bodyText(va.colors.primaryText)}>
              {recommendedAction.title}
            </div>

            <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
              {recommendedAction.description}
            </div>

            <PrimaryButton
              fullWidth
              onClick={() => navigate(recommendedAction.path)}
            >
              {recommendedAction.buttonLabel}
            </PrimaryButton>
          </div>
        </SectionCard>
        <SectionCard
          title="Program Status"
          description="Your current status for each program."
        >
          <div
            className={va.layout.infoList}
            style={{ color: va.colors.primaryTextDark }}
          >
            {programStatuses.length > 0 ? (
              programStatuses.map((item) => (
                <div
                  key={item.id}
                  className={va.panels.secondaryPanel}
                  style={{
                    backgroundColor: va.colors.surfaceColor,
                    borderColor: va.colors.borderColor,
                    padding: "12px",
                  }}
                >
                  <div>Program: {item.program_id}</div>
                  <div>Status: {item.status}</div>
                </div>
              ))
            ) : (
              <div>No program status records yet.</div>
            )}
          </div>
        </SectionCard>
        <SectionCard
          title="Programs"
          description="Your available and locked program options."
        >
          <div className={va.layout.programGrid}>
            {PROGRAMS.map((program) => (
              <DashboardProgramCard
                key={program.id}
                program={program}
                profile={profile}
                programStatuses={programStatuses}
                onStatusChanged={loadDashboardData}
              />
            ))}
          </div>
        </SectionCard>
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
                  <div>Program: {payment.program_id}</div>
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
