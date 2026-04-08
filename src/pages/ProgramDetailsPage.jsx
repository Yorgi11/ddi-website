import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { visualAid as va } from "../config/visualAid";
import { currency } from "../lib/money";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { getProgramDisplayState } from "../lib/programDisplay";
import PageContainer from "../components/PageContainer";
import SectionCard from "../components/SectionCard";
import PrimaryButton from "../components/PrimaryButton";
import SecondaryButton from "../components/SecondaryButton";

export default function ProgramDetailsPage({ program }) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [programStatuses, setProgramStatuses] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    async function loadStatuses() {
      if (!user) {
        setProgramStatuses([]);
        setLoadingStatus(false);
        return;
      }

      const { data, error } = await supabase
        .from("program_status")
        .select("*")
        .eq("user_id", user.id);

      if (!error) {
        setProgramStatuses(data ?? []);
      }

      setLoadingStatus(false);
    }

    loadStatuses();
  }, [user]);

  if (!program) return null;

  const display = getProgramDisplayState(program, profile, programStatuses);

  function renderAction() {
    if (loadingStatus) {
      return (
        <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
          Loading program status...
        </div>
      );
    }

    if (display.state === "locked") {
      return (
        <>
          <div style={va.textStyles.bodyTextThin(va.colors.warningColor)}>
            {display.message}
          </div>
          <SecondaryButton fullWidth onClick={() => navigate("/programs")}>
            Back to programs
          </SecondaryButton>
        </>
      );
    }

    if (display.state === "available") {
      return (
        <>
          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            {display.message}
          </div>
          <PrimaryButton
            fullWidth
            onClick={() => navigate(`/checkout/${program.id}`)}
          >
            Checkout
          </PrimaryButton>
          <SecondaryButton fullWidth onClick={() => navigate("/programs")}>
            Back to programs
          </SecondaryButton>
        </>
      );
    }

    if (display.state === "paid") {
      return (
        <>
          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            {display.message}
          </div>
          <PrimaryButton fullWidth onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </PrimaryButton>
          <SecondaryButton fullWidth onClick={() => navigate("/programs")}>
            Back to programs
          </SecondaryButton>
        </>
      );
    }

    if (display.state === "in_progress") {
      return (
        <>
          <div style={va.textStyles.bodyTextThin(va.colors.primaryColor)}>
            {display.message}
          </div>
          <PrimaryButton fullWidth onClick={() => navigate("/dashboard")}>
            Continue Program
          </PrimaryButton>
          <SecondaryButton fullWidth onClick={() => navigate("/programs")}>
            Back to programs
          </SecondaryButton>
        </>
      );
    }

    if (display.state === "completed") {
      return (
        <>
          <div style={va.textStyles.bodyTextThin(va.colors.successColor)}>
            {display.message}
          </div>
          <SecondaryButton fullWidth onClick={() => navigate("/dashboard")}>
            View Dashboard
          </SecondaryButton>
          <SecondaryButton fullWidth onClick={() => navigate("/programs")}>
            Back to programs
          </SecondaryButton>
        </>
      );
    }

    return null;
  }

  return (
    <PageContainer>
      <div className={va.layout.detailsGrid}>
        <SectionCard
          title={program.name}
          description={`${program.grades} • ${program.ages} • ${program.timeline}`}
        >
          <div className={va.spacing.stackGap}>
            <div>
              <h3
                className={`${va.spacing.marginBottomSmall} ${va.text.strongText}`}
                style={{ color: va.colors.primaryText }}
              >
                Program details
              </h3>
              <p
                className={va.text.smallFont}
                style={{ color: va.colors.primaryTextDark }}
              >
                {program.summary}
              </p>
            </div>

            <div>
              <h3
                className={`${va.spacing.marginBottomSmall} ${va.text.strongText}`}
                style={{ color: va.colors.primaryText }}
              >
                General course breakdown
              </h3>
              <ul
                className="list-disc pl-5 space-y-2 text-sm"
                style={{ color: va.colors.primaryTextDark }}
              >
                {program.breakdown.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3
                className={`${va.spacing.marginBottomSmall} ${va.text.strongText}`}
                style={{ color: va.colors.primaryText }}
              >
                Entry requirements
              </h3>
              <p
                className={va.text.smallFont}
                style={{ color: va.colors.primaryTextDark }}
              >
                {program.rules}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Program Status"
          description="Your current access and next action for this program."
        >
          <div className={va.spacing.sectionStack}>
            <div
              className={va.layout.summaryRow}
              style={{ color: va.colors.primaryText }}
            >
              <span>Program cost</span>
              <span className={va.text.strongText}>
                {currency(program.price)}
              </span>
            </div>

            {renderAction()}
          </div>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
