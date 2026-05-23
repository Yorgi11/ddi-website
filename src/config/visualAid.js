export const visualAid = {
  colors: {
    primaryColor: "#2563eb",
    primaryColorDark: "#1d4ed8",

    secondaryColor: "#14b866",
    secondaryColorDark: "#0d7440",

    pageColor: "#f8fafc",
    surfaceColor: "#ffffff",

    primaryText: "#0f172a",
    primaryTextDark: "#475569",

    secondaryText: "#ffffff",
    secondaryTextDark: "#dbeafe",

    borderColor: "#cbd5e1",

    successColor: "#059669",
    warningColor: "#dc2626",
  },

  text: {
    smallFont: "text-sm",
    bodyFont: "text-base",
    largeFont: "text-xl md:text-2xl",
    pageTitleFont: "text-3xl md:text-4xl font-semibold",
    sectionTitleFont: "text-2xl font-semibold",
    cardTitleFont: "text-xl font-semibold",
    mutedText: "text-sm",
    strongText: "font-semibold",
  },

  spacing: {
    centerSpacing: "mx-auto max-w-6xl px-4",
    sectionSpacing: "py-8 md:py-10",
    cardSpacing: "p-6",

    stackGap: "space-y-6",
    smallGap: "gap-3",
    mediumGap: "gap-4",
    largeGap: "gap-6",

    pageStack: "space-y-8",
    sectionStack: "space-y-4",
    textStack: "space-y-2",

    marginBottomSmall: "mb-2",
    marginBottomMedium: "mb-3",
    marginBottomLarge: "mb-4",
    marginTopSmall: "mt-1",
    marginTopMedium: "mt-4",

    paddingInput: "px-4 py-3",
    paddingButton: "px-4 py-2",
  },

  panels: {
    primaryPanel: "rounded-lg border shadow-sm",
    secondaryPanel: "rounded-lg border",
    mutedPanel: "rounded-lg border",
    dashedPanel: "rounded-lg border border-dashed",
  },

  textStyles: {
    navButtonText: (color) => ({
      fontSize: "18px",
      fontWeight: "600",
      lineHeight: "1.2",
      color: color,
    }),
    smallText: (color) => ({
      fontSize: "14px",
      color: color,
    }),
    bodyText: (color) => ({
      fontSize: "16px",
      fontWeight: "600",
      color: color,
    }),
    bodyTextThin: (color) => ({
      fontSize: "16px",
      fontWeight: "200",
      color: color,
    }),
    baseText: (color) => ({
      fontSize: "16px",
      color: color,
    }),
  },

  buttons: {
    primaryButton:
      "inline-flex items-center justify-center rounded-lg px-4 py-2 transition hover:opacity-90",
    secondaryButton:
      "inline-flex items-center justify-center rounded-lg border px-4 py-2 transition",
    optionButton: "rounded-lg border px-4 py-3 text-left transition",
    fullWidthButton: "w-full",
    disabledButton: "disabled:cursor-not-allowed disabled:opacity-50",
  },

  layout: {
    appShell: "min-h-screen",
    navbarShell: "sticky top-0 z-20 border-b",
    navbarInner: "flex items-center justify-between py-0",
    navList: "hidden gap-2 md:flex",

    twoColumn: "grid gap-6 md:grid-cols-2",
    accountGrid: "grid gap-6 lg:grid-cols-[1fr_.9fr]",
    checkoutGrid: "grid gap-6 lg:grid-cols-[1.2fr_.8fr]",
    detailsGrid: "grid gap-6 lg:grid-cols-[1.4fr_.8fr]",
    courseGrid: "grid gap-4 md:grid-cols-3",

    flexWrapRow: "flex flex-wrap gap-3",
    iconRow: "flex items-center gap-2",
    infoList: "grid gap-3",
    contactList: "space-y-2",

    titleRow: "flex items-center justify-between gap-3",
    summaryRow: "flex items-center justify-between text-sm",
    splitRow: "flex justify-between",
    borderedTopRow:
      "border-t pt-3 flex justify-between text-base font-semibold",

    inputGridTwo: "grid gap-4 md:grid-cols-2",
    spanTwo: "md:col-span-2",
    toggleGridTwo: "grid grid-cols-2 gap-3",
    paymentMethodGrid: "grid gap-3 md:grid-cols-2",
  },

  forms: {
    inputBase: "w-full rounded-lg border px-4 py-3",
    inputInline: "rounded-lg border px-4 py-3",
    choiceButton: "rounded-lg border px-4 py-3 text-left",
    checkboxPanel: "flex items-start gap-3 rounded-lg border p-4",
    activeRing: "ring-2",
    inputPlaceholder: "placeholder:text-[#64748b]",
  },

  icons: {
    small: "h-4 w-4",
    medium: "h-5 w-5",
    logoBox: "flex h-10 w-10 items-center justify-center rounded-lg shadow",
  },

  misc: {
    hiddenDesktopNav: "hidden md:flex",
    textLeft: "text-left",
    roundedPill: "rounded-full px-3 py-1 text-sm font-medium",
  },
};

export const stylePreset = {
  centerSpacing: visualAid.spacing.centerSpacing,
  largeFont: visualAid.text.largeFont,
  primaryColor: visualAid.colors.primaryColor,
  primaryText: visualAid.colors.primaryText,
  surfaceColor: visualAid.colors.surfaceColor,
  primaryPanel: visualAid.panels.primaryPanel,
  secondaryPanel: visualAid.panels.secondaryPanel,
  primaryButton: visualAid.buttons.primaryButton,
  secondaryButton: visualAid.buttons.secondaryButton,
  pageTitleFont: visualAid.text.pageTitleFont,
  sectionTitleFont: visualAid.text.sectionTitleFont,
};
