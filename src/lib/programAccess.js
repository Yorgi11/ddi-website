export function canAccessProgram(programId, profile) {
  if (!programId) return false;
  if (programId === "level1") return true;
  if (!profile) return false;

  const completed = profile.completed_levels ?? [];
  const placement = profile.placement_access ?? [];

  if (programId === "level2") {
    return completed.includes("level1") || placement.includes("level2");
  }

  if (programId === "level3") {
    return completed.includes("level2") || placement.includes("level3");
  }

  return false;
}

export function getProgramAccessMessage(programId, profile) {
  if (programId === "level1") return "";

  if (!profile) {
    return "You must be logged in to access this program.";
  }

  const completed = profile.completed_levels ?? [];
  const placement = profile.placement_access ?? [];

  if (
    programId === "level2" &&
    !completed.includes("level1") &&
    !placement.includes("level2")
  ) {
    return "Level 2 requires completion of Level 1 or passing a placement test.";
  }

  if (
    programId === "level3" &&
    !completed.includes("level2") &&
    !placement.includes("level3")
  ) {
    return "Level 3 requires completion of Level 2 or passing a placement test.";
  }

  return "";
}
