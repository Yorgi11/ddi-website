import { visualAid as va } from "../config/visualAid";

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  fullWidth = false,
  type = "button",
  color = va.colors.secondaryText,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${va.buttons.primaryButton} ${fullWidth ? va.buttons.fullWidthButton : ""} ${va.buttons.disabledButton}`}
      style={{
        backgroundColor: va.colors.primaryColor,
        ...va.textStyles.bodyText(color),
      }}
    >
      {children}
    </button>
  );
}
