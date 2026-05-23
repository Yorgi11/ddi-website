export function calculateAssignmentPercent(pointsAwarded, pointsPossible) {
  if (!pointsPossible || Number(pointsPossible) <= 0) return null;
  if (pointsAwarded == null) return null;
  return Math.round((Number(pointsAwarded) / Number(pointsPossible)) * 10000) / 100;
}

export function calculateWeightedFinalGrade(grades = []) {
  const gradedItems = grades.filter((grade) => grade.grade_percent != null);
  const totalWeight = gradedItems.reduce(
    (sum, grade) => sum + Number(grade.weight ?? 1),
    0,
  );

  if (totalWeight <= 0) return null;

  const weighted = gradedItems.reduce(
    (sum, grade) =>
      sum + Number(grade.grade_percent) * Number(grade.weight ?? 1),
    0,
  );

  return Math.round((weighted / totalWeight) * 100) / 100;
}
