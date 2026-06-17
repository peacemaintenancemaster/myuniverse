import { create } from "zustand";

export interface Star {
  id: number;
  position: [number, number, number];
  color: string;
  size: number;
  answer: string;
  question: string;
  createdAt: number;
}

const QUESTIONS = [
  "요즘 당신의 마음을 가장 많이 차지하는 것은 무엇인가요?",
  "최근 당신이 가장 편안함을 느낀 순간은 언제였나요?",
  "지금 당신에게 가장 중요한 가치는 무엇인가요?",
];

// HR도표 색온도: 답의 글자 수(감정 강도 프록시)에 따라
// 격한(긴) 답 = 뜨거운 파란 별, 차분한(짧은) 답 = 따뜻한 금빛 별
function starColorFromAnswer(answer: string): string {
  const len = answer.length;
  if (len > 150) return "#9bb0ff";  // O형 — 파란 별 (뜨겁고 격렬)
  if (len > 100) return "#aabfff";  // B형 — 청백색
  if (len > 60) return "#cad7ff";   // A형 — 백색
  if (len > 30) return "#fff4e8";   // F형 — 황백
  return "#ffd2a1";                 // K형 — 따뜻한 금빛 (차분)
}

function randomStarPosition(index: number): [number, number, number] {
  const angle = (index / QUESTIONS.length) * Math.PI * 2 + Math.random() * 0.5;
  const radius = 2.5 + Math.random() * 1.5;
  return [
    Math.cos(angle) * radius,
    (Math.random() - 0.5) * 1.5,
    Math.sin(angle) * radius,
  ];
}

interface UniverseState {
  stars: Star[];
  currentQuestionIndex: number;
  selectedStar: Star | null;
  isAnswering: boolean;
  showIntro: boolean;
  nebulaDissolveTargets: [number, number, number][];
  addStar: (answer: string) => void;
  selectStar: (star: Star | null) => void;
  setAnswering: (v: boolean) => void;
  dismissIntro: () => void;
}

export const useUniverse = create<UniverseState>((set, get) => ({
  stars: [],
  currentQuestionIndex: 0,
  selectedStar: null,
  isAnswering: false,
  showIntro: true,
  nebulaDissolveTargets: [],

  addStar: (answer: string) => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex >= QUESTIONS.length) return;

    const position = randomStarPosition(currentQuestionIndex);
    const newStar: Star = {
      id: Date.now(),
      position,
      color: starColorFromAnswer(answer),
      size: 0.15 + Math.random() * 0.1,
      answer,
      question: QUESTIONS[currentQuestionIndex],
      createdAt: Date.now(),
    };

    set((state) => ({
      stars: [...state.stars, newStar],
      currentQuestionIndex: state.currentQuestionIndex + 1,
      isAnswering: false,
      nebulaDissolveTargets: [...state.nebulaDissolveTargets, position],
    }));
  },

  selectStar: (star) => set({ selectedStar: star }),
  setAnswering: (v) => set({ isAnswering: v }),
  dismissIntro: () => set({ showIntro: false }),
}));

export { QUESTIONS };
