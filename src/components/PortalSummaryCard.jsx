import { useNavigate } from "react-router-dom";
import { visualAid as va } from "../config/visualAid";
import PrimaryButton from "./PrimaryButton";
import SectionCard from "./SectionCard";

export default function PortalSummaryCard({ summary }) {
  const navigate = useNavigate();

  return (
    <SectionCard
      title="Portal Summary"
      description="Your current status and best next step."
    >
      <div className={va.spacing.sectionStack}>
        <div
          className={va.layout.infoList}
          style={{ color: va.colors.primaryTextDark }}
        >
          <div>Current Level: {summary.currentLevel}</div>
          <div>
            Active Program:{" "}
            {summary.activeProgram?.name ?? "None currently in progress"}
          </div>
          <div>Next Unlock Target: {summary.nextUnlockTarget}</div>
        </div>

        <div style={va.textStyles.bodyText(va.colors.primaryText)}>
          {summary.recommended.title}
        </div>

        <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
          {summary.recommended.description}
        </div>

        <PrimaryButton
          fullWidth
          onClick={() => navigate(summary.recommended.path)}
        >
          {summary.recommended.buttonLabel}
        </PrimaryButton>
      </div>
    </SectionCard>
  );
}
