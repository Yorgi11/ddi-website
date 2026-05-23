import { visualAid as va } from "../../config/visualAid";

const TABS = [
  { id: "home", label: "Home" },
  { id: "classwork", label: "Class Work" },
  { id: "posts", label: "Posts" },
];

export default function ClassTabNav({ activeTab, onChange }) {
  return (
    <div
      className={va.layout.toggleGridTwo}
      style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
    >
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={
              active ? va.buttons.primaryButton : va.buttons.secondaryButton
            }
            style={{
              backgroundColor: active
                ? va.colors.primaryColor
                : va.colors.surfaceColor,
              borderColor: active ? va.colors.primaryColor : va.colors.borderColor,
              ...va.textStyles.bodyText(
                active ? va.colors.secondaryText : va.colors.primaryText,
              ),
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
