import { visualAid as va } from "../config/visualAid";

export default function SectionCard({
  title,
  description,
  children,
  fullHeight = false,
  minHeight = null,
}) {
  return (
    <section
      className={`${va.panels.primaryPanel} ${va.spacing.cardSpacing}`}
      style={{
        backgroundColor: va.colors.surfaceColor,
        borderColor: va.colors.borderColor,
        color: va.colors.primaryText,
        display: "flex",
        flexDirection: "column",
        height: fullHeight ? "100%" : "auto",
        minHeight: minHeight ?? "auto",
      }}
    >
      {(title || description) && (
        <div className={va.spacing.marginBottomLarge}>
          {title && (
            <h2
              className={va.text.sectionTitleFont}
              style={{ color: va.colors.primaryText }}
            >
              {title}
            </h2>
          )}

          {description && (
            <p
              className={`${va.spacing.marginTopSmall} ${va.text.smallFont}`}
              style={{ color: va.colors.primaryTextDark }}
            >
              {description}
            </p>
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {children}
      </div>
    </section>
  );
}
