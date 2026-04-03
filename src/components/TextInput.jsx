import { visualAid as va } from "../config/visualAid";

export default function TextInput({
  type = "text",
  placeholder = "",
  value = "",
  onChange,
  fullWidth = true,
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={fullWidth ? va.forms.inputBase : va.forms.inputInline}
      style={{
        backgroundColor: va.colors.surfaceColor,
        color: va.colors.primaryText,
        borderColor: va.colors.borderColor,
        "--placeholder-color": va.colors.secondaryColorDark,
      }}
    />
  );
}
