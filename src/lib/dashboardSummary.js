import { PROGRAMS } from "../data/programs";
import { getProgramDisplayState } from "./programDisplay";
import { getRecommendedAction } from "./recommendedAction";

export function getActiveProgram(programStatuses = []) {
  return programStatuses.find((item) => item.status === "in_progress") ?? null;
}

export function getNextUnlockTarget(profile) {
  const completed = profile?.completed_levels ?? [];
  const placement = profile?.placement_access ?? [];

  if (!completed.includes("level1") && !placement.includes("level2")) {
    return "Complete Level 1 or earn placement access for Level 2.";
  }

  if (!completed.includes("level2") && !placement.includes("level3")) {
    return "Complete Level 2 or earn placement access for Level 3.";
  }

  return "You have reached the highest current progression path.";
}

export function getPortalSummary(profile, programStatuses = []) {
  const activeStatus = getActiveProgram(programStatuses);
  const activeProgram = activeStatus
    ? PROGRAMS.find((program) => program.id === activeStatus.program_id)
    : null;

  const recommended = getRecommendedAction(profile, programStatuses);

  return {
    activeProgram,
    currentLevel: profile?.current_level ?? 1,
    nextUnlockTarget: getNextUnlockTarget(profile),
    recommended,
  };
}
