export interface CognitiveHistoryEntry {
  text: string;
  timestamp: string;
  mode: string;
}

export interface CognitiveState {
  isFatigued: boolean;
  score: number;
  pomodoroTime: number;
  shortBreakTime: number;
}

export function analyzeCognitiveLoad(history: CognitiveHistoryEntry[]): CognitiveState {
  if (!history || history.length === 0) {
    return { isFatigued: false, score: 0, pomodoroTime: 1500, shortBreakTime: 300 };
  }

  const fatigueKeywords = ["tired", "distracted", "exhausted", "burnt out", "burnout", "can't focus", "struggling"];
  const flowKeywords = ["flow", "crushed", "locked in", "focused", "productive", "easy", "great"];

  let fatigueCount = 0;
  let flowCount = 0;

  // Analyze the last 5 entries to gauge recent cognitive load
  const recentHistory = history.slice(-5);

  recentHistory.forEach(entry => {
    const lowerText = entry.text.toLowerCase();
    fatigueKeywords.forEach(kw => {
      if (lowerText.includes(kw)) fatigueCount += 1;
    });
    flowKeywords.forEach(kw => {
      if (lowerText.includes(kw)) flowCount += 1;
    });
  });

  const score = flowCount - fatigueCount;
  // If recent fatigue markers heavily outweigh flow markers, trigger adaptive pacing
  const isFatigued = fatigueCount > flowCount || fatigueCount >= 2;

  return {
    isFatigued,
    score,
    pomodoroTime: isFatigued ? 900 : 1500, // 15 mins vs 25 mins
    shortBreakTime: isFatigued ? 600 : 300, // 10 mins vs 5 mins
  };
}
