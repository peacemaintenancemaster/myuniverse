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

const STAR_COLORS = ["#aaccff", "#ffe4b5", "#ffd2a1", "#c7d8ff", "#fff5e1"];

function randomStarPosition(index: number): [number, number, number] {
  const angle = (index / QUESTIONS.length) * Math.PI * 2 + Math.random() * 0.5;
  const radius = 2.5 + Math.random() * 1.5;
  return [
    Math.cos(angle) * radius,
    (Math.random() - 0.5) * 2,
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
      color: STAR_COLORS[currentQuestionIndex % STAR_COLORS.length],
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
