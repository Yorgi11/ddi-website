import { visualAid as va } from "../config/visualAid";

export default function PageContainer({ children, className = "" }) {
  return (
    <main
      className={`${va.spacing.centerSpacing} ${va.spacing.sectionSpacing} ${className}`}
      style={{
        backgroundColor: va.colors.pageColor,
        color: va.colors.primaryText,
      }}
    >
      {children}
    </main>
  );
}
