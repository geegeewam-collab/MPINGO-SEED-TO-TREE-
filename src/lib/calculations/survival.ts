export function calculateSurvivalMetrics(
  originallyPlanted: number,
  alive: number,
  dead: number,
  unresolved: number,
  uninspected: number
) {
  const classified = alive + dead;
  const totalObserved = alive + dead + unresolved;

  // 1. Survival among classified observations
  // alive / (alive + dead)
  const survivalAmongClassified = classified > 0
    ? (alive / classified) * 100
    : null;

  // 2. Confirmed alive as a share of the original planted quantity
  // alive / originallyPlanted
  const confirmedAliveShare = originallyPlanted > 0
    ? (alive / originallyPlanted) * 100
    : null;

  // 3. Assessment coverage
  // actually assessed / originallyPlanted
  const assessmentCoverage = originallyPlanted > 0
    ? (totalObserved / originallyPlanted) * 100
    : null;

  return {
    survivalAmongClassified,
    confirmedAliveShare,
    assessmentCoverage,
    denominators: {
      classified,
      originallyPlanted,
      totalObserved
    }
  };
}
