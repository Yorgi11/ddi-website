import { useNavigate } from "react-router-dom";
import { currency } from "../lib/money";
import { getProgramDisplayState } from "../lib/programDisplay";
import { visualAid as va } from "../config/visualAid";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function DashboardProgramCard({
  program,
  profile,
  programStatuses,
  onStatusChanged,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const display = getProgramDisplayState(program, profile, programStatuses);

  async function handleStartProgram() {
    if (!user) return;

    setLoading(true);

    const { error } = await supabase.from("program_status").upsert(
      {
        user_id: user.id,
        program_id: program.id,
        status: "in_progress",
      },
      { onConflict: "user_id,program_id" },
    );

    setLoading(false);

    if (!error && onStatusChanged) {
      onStatusChanged();
    }
  }

  return (
    <div
      className={va.panels.primaryPanel}
      style={{
        backgroundColor: va.colors.surfaceColor,
        borderColor: va.colors.borderColor,
        padding: "16px",
        color: va.colors.primaryText,
      }}
    >
      <div className={va.spacing.sectionStack}>
        <div>
          <div className={va.text.cardTitleFont}>{program.name}</div>
          <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
            {program.grades} • {program.ages}
          </div>
        </div>

        <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
          {program.summary}
        </div>

        <div style={va.textStyles.bodyText(va.colors.primaryText)}>
          Price: {currency(program.price)}
        </div>

        <div
          style={
            display.state === "locked"
              ? va.textStyles.bodyTextThin(va.colors.warningColor)
              : display.state === "completed"
                ? va.textStyles.bodyTextThin(va.colors.successColor)
                : display.state === "in_progress"
                  ? va.textStyles.bodyTextThin(va.colors.primaryColor)
                  : va.textStyles.bodyTextThin(va.colors.primaryTextDark)
          }
        >
          {display.message}
        </div>

        {display.state === "available" && (
          <PrimaryButton
            fullWidth
            onClick={() => navigate(`/programs/${program.id}`)}
          >
            View Program
          </PrimaryButton>
        )}

        {display.state === "paid" && (
          <div className={va.spacing.sectionStack}>
            <PrimaryButton
              fullWidth
              onClick={handleStartProgram}
              disabled={loading}
            >
              {loading ? "Starting..." : "Start Program"}
            </PrimaryButton>
            <SecondaryButton
              fullWidth
              onClick={() => navigate(`/programs/${program.id}`)}
            >
              View Program
            </SecondaryButton>
          </div>
        )}

        {display.state === "in_progress" && (
          <SecondaryButton
            fullWidth
            onClick={() => navigate(`/programs/${program.id}`)}
          >
            Continue Program
          </SecondaryButton>
        )}

        {display.state === "completed" && (
          <SecondaryButton
            fullWidth
            onClick={() => navigate(`/programs/${program.id}`)}
          >
            Review Program
          </SecondaryButton>
        )}

        {display.state === "locked" && (
          <SecondaryButton
            fullWidth
            onClick={() => navigate(`/programs/${program.id}`)}
          >
            View Requirements
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}
