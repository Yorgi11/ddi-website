import { visualAid as va } from "../config/visualAid";

export default function TimelineItem({ item }) {
  function getColor() {
    if (item.type === "payment") return va.colors.secondaryColor;
    if (item.type === "unlock") return va.colors.primaryColor;
    if (item.title.includes("Completed")) return va.colors.successColor;
    return va.colors.primaryTextDark;
  }

  return (
    <div
      className={va.panels.secondaryPanel}
      style={{
        backgroundColor: va.colors.surfaceColor,
        borderColor: va.colors.borderColor,
        padding: "12px",
      }}
    >
      <div
        style={{
          ...va.textStyles.bodyText(getColor()),
          marginBottom: "4px",
        }}
      >
        {item.title}
      </div>

      <div style={va.textStyles.bodyTextThin(va.colors.primaryTextDark)}>
        {item.description}
      </div>

      <div style={va.textStyles.bodyTextThin(va.colors.secondaryText)}>
        {new Date(item.date).toLocaleString()}
      </div>
    </div>
  );
}
