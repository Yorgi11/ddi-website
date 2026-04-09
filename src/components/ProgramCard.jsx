import { visualAid as va } from "../config/visualAid";
import { currency } from "../lib/money";

export default function ProgramCard({ program, onView }) {
  return (
    <div
      className={`${va.panels.primaryPanel} ${va.spacing.cardSpacing}`}
      style={{
        backgroundColor: va.colors.surfaceColor,
        borderColor: va.colors.borderColor,
        color: va.colors.primaryText,
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div className={`${va.layout.titleRow} ${va.spacing.marginBottomMedium}`}>
        <h3
          className={va.text.cardTitleFont}
          style={{ color: va.colors.primaryText }}
        >
          {program.name}
        </h3>

        <div
          className={va.misc.roundedPill}
          style={{
            backgroundColor: va.colors.secondaryColorDark,
            color: va.colors.primaryText,
            border: `1px solid ${va.colors.borderColor}`,
          }}
        >
          {currency(program.price)}
        </div>
      </div>

      <div
        className={`${va.spacing.marginBottomMedium} ${va.text.smallFont}`}
        style={{ color: va.colors.primaryTextDark }}
      >
        {program.grades} • {program.ages}
      </div>

      <p
        className={va.text.smallFont}
        style={{ color: va.colors.primaryTextDark }}
      >
        {program.summary}
      </p>

      <div style={{ marginTop: "auto", paddingTop: "16px" }}>
        <button
          onClick={() => onView(program.id)}
          className={`${va.buttons.primaryButton} ${va.buttons.fullWidthButton}`}
          style={{
            backgroundColor: va.colors.primaryColor,
            ...va.textStyles.bodyText(va.colors.secondaryText),
          }}
        >
          View Program
        </button>
      </div>
    </div>
  );
}
