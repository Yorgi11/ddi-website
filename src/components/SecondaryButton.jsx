import { visualAid as va } from "../config/visualAid";

export default function SecondaryButton({
  children,
  onClick,
  fullWidth = false,
  type = "button",
  textColor = va.colors.primaryText,
  backgroundColor = va.colors.surfaceColor,
  borderColor = va.colors.borderColor,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${va.buttons.secondaryButton} ${fullWidth ? va.buttons.fullWidthButton : ""}`}
      style={{
        backgroundColor,
        borderColor,
        ...va.textStyles.bodyText(textColor),
      }}
    >
      {children}
    </button>
  );
}
