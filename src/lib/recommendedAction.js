import { PROGRAMS } from "../data/programs";
import { getProgramDisplayState } from "./programDisplay";

export function getRecommendedAction(profile, programStatuses = []) {
  for (const program of PROGRAMS) {
    const display = getProgramDisplayState(program, profile, programStatuses);

    if (display.state === "available") {
      return {
        title: `Enroll in ${program.name}`,
        description: display.message,
        buttonLabel: "View Program",
        path: `/programs/${program.id}`,
      };
    }

    if (display.state === "paid") {
      return {
        title: `Start ${program.name}`,
        description:
          "You have already paid for this program and can begin now.",
        buttonLabel: "Go to Dashboard",
        path: "/dashboard",
      };
    }

    if (display.state === "in_progress") {
      return {
        title: `Continue ${program.name}`,
        description: "You already started this program.",
        buttonLabel: "Go to Dashboard",
        path: "/dashboard",
      };
    }
  }

  return {
    title: "All current programs completed",
    description: "You have completed or locked all currently available paths.",
    buttonLabel: "View Programs",
    path: "/programs",
  };
}
