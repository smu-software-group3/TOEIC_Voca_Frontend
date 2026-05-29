export function partOfSpeechToKorean(pos) {
  const map = {
    NOUN: "명사",
    VERB: "동사",
    ADJECTIVE: "형용사",
    ADVERB: "부사",
    PRONOUN: "대명사",
    PREPOSITION: "전치사",
    CONJUNCTION: "접속사",
    INTERJECTION: "감탄사",
    ARTICLE: "관사",
  };

  return map[pos] ?? pos;
}

export function partOfSpeechColor(pos) {
  switch (pos) {
    case "NOUN":
      return "#2563eb";
    case "VERB":
      return "#0d9488";
    case "ADJECTIVE":
      return "#7c3aed";
    case "ADVERB":
      return "#d97706";
    case "PRONOUN":
      return "#db2777";
    case "PREPOSITION":
      return "#0f766e";
    case "CONJUNCTION":
      return "#4f46e5";
    case "INTERJECTION":
      return "#dc2626";
    case "ARTICLE":
      return "#334155";
    default:
      return "#64748b";
  }
}

export function partOfSpeechBadgeClass(pos) {
  switch (pos) {
    case "NOUN":
      return "pos-badge pos-badge--noun";
    case "VERB":
      return "pos-badge pos-badge--verb";
    case "ADJECTIVE":
      return "pos-badge pos-badge--adjective";
    case "ADVERB":
      return "pos-badge pos-badge--adverb";
    case "PRONOUN":
      return "pos-badge pos-badge--pronoun";
    case "PREPOSITION":
      return "pos-badge pos-badge--preposition";
    case "CONJUNCTION":
      return "pos-badge pos-badge--conjunction";
    case "INTERJECTION":
      return "pos-badge pos-badge--interjection";
    case "ARTICLE":
      return "pos-badge pos-badge--article";
    default:
      return "pos-badge pos-badge--default";
  }
}
