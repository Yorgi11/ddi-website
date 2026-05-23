import { ChevronDown, ChevronRight } from "lucide-react";
import { visualAid as va } from "../config/visualAid";

export default function ExpandableDetails({
  expanded,
  onToggle,
  label = "Details",
  children,
}) {
  const Icon = expanded ? ChevronDown : ChevronRight;

  return (
    <div className={va.spacing.sectionStack}>
      <button
        type="button"
        onClick={onToggle}
        className={va.layout.iconRow}
        aria-expanded={expanded}
        style={{
          color: va.colors.primaryColor,
          width: "fit-content",
          fontWeight: 700,
        }}
      >
        <Icon className={va.icons.small} aria-hidden="true" />
        <span>{expanded ? `Hide ${label}` : `Show ${label}`}</span>
      </button>

      {expanded && (
        <div
          className={va.layout.infoList}
          style={{
            color: va.colors.primaryTextDark,
            whiteSpace: "pre-wrap",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
