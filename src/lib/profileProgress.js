export function getDerivedCurrentLevel(profile) {
  if (!profile) return 1;

  const completed = profile.completed_levels ?? [];
  const placement = profile.placement_access ?? [];

  let level = 1;

  if (completed.includes("level1") || placement.includes("level2")) {
    level = Math.max(level, 2);
  }

  if (completed.includes("level2") || placement.includes("level3")) {
    level = Math.max(level, 3);
  }

  return level;
}
