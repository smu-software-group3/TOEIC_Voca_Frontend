export function translateDifficulty(difficulty) {
  const map = {
    EASY: "쉬움",
    MEDIUM: "중간",
    HARD: "어려움",
  };

  return map[difficulty] ?? difficulty;
}

/** 배지 팔레트와 맞춘 악센트 색 (테두리·차트 등). */
export function difficultyColor(difficulty) {
  switch (difficulty) {
    case "EASY":
      return "#0d9488";
    case "MEDIUM":
      return "#d97706";
    case "HARD":
      return "#7c3aed";
    default:
      return "#94a3b8";
  }
}

export function difficultyBadgeClass(difficulty) {
  switch (difficulty) {
    case "EASY":
      return "diff-badge diff-badge--easy";
    case "MEDIUM":
      return "diff-badge diff-badge--medium";
    case "HARD":
      return "diff-badge diff-badge--hard";
    default:
      return "diff-badge diff-badge--easy";
  }
}
