import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

// ── 감정 강도(규칙기반) → 별 색온도 ─────────────────────────────
// 스펙 §6-1: 부정/강조 어휘 밀도 + 문장부호 → 0~1 스칼라.
// (정식 버전은 KNU 감성사전 degree값을 쓸 예정. 여기선 가벼운 프록시.)
const EMPHASIS = [
  "너무", "정말", "진짜", "완전", "아주", "매우", "제발",
  "짜증", "화나", "힘들", "싫", "최악", "억울", "분노",
  "불안", "두려", "무서", "외로", "슬프", "눈물", "견딜", "지치", "지쳐",
];

function emotionIntensity(answer: string): number {
  const t = answer;
  let score = 0;
  for (const w of EMPHASIS) if (t.includes(w)) score += 0.12;
  const marks = (t.match(/[!?]/g) || []).length;
  score += Math.min(marks * 0.1, 0.3);
  if (/[ㅠㅜ]/.test(t)) score += 0.15;
  if (/ㅋㅋ|ㅎㅎ/.test(t)) score -= 0.1; // 웃음 → 차분 쪽
  return Math.max(0, Math.min(1, score));
}

// HR도표 색온도: 차분(낮은 강도) = 따뜻한 금빛, 격함(높은 강도) = 뜨거운 파랑
function starColorFromIntensity(t: number): string {
  if (t < 0.3) return "#ffd2a1"; // K형 — 따뜻한 금빛 (차분)
  if (t < 0.5) return "#fff4e8"; // F형 — 황백
  if (t < 0.7) return "#cad7ff"; // A형 — 청백
  return "#9bb0ff"; // O/B형 — 파란 별 (격렬)
}

// 별 크기: 답변 길이에 비례 (스펙 §6-1)
function starSizeFromLength(len: number): number {
  if (len < 50) return 0.18; // 짧은 한 줄 = 작은 점
  if (len < 200) return 0.28; // 중간
  return 0.42; // 긴 글 = 밝은 별
}

// ── 위기 신호 감지(규칙기반, 스펙 §4-1) ─────────────────────────
// 프로토타입 수준의 최소 구현. 정식 버전은 형태소 단위 + 정교한 부정맥락 게이트.
const CRISIS_TRIGGERS = [
  "죽고 싶", "죽고싶", "자해", "자살", "끝내고 싶", "끝내고싶",
  "사라지고 싶", "사라지고싶", "없어지고 싶", "없어지고싶",
  "다 의미 없", "다의미없", "나만 없으면", "짐이 되", "짐이되",
  "더 이상 못", "더이상 못", "견딜 수 없", "견딜수 없",
];
// 부정맥락 게이트: 관용 표현("죽고 싶을 만큼 ~")은 제외
const CRISIS_NEGATION = ["만큼", "정도로"];

function detectCrisis(answer: string): boolean {
  const t = answer.replace(/\s+/g, " ");
  if (!CRISIS_TRIGGERS.some((k) => t.includes(k))) return false;
  if (CRISIS_NEGATION.some((n) => t.includes(n))) return false;
  return true;
}

function randomStarPosition(index: number): [number, number, number] {
  const angle = (index / QUESTIONS.length) * Math.PI * 2 + (Math.random() - 0.5) * 1.2;
  const radius = 4 + Math.random() * 5;
  return [
    Math.cos(angle) * radius,
    (Math.random() - 0.5) * 2.5,
    Math.sin(angle) * radius,
  ];
}

let nextStarId = 1; // 단조 증가 id (Date.now() 충돌 방지)

interface UniverseState {
  stars: Star[];
  currentQuestionIndex: number;
  selectedStar: Star | null;
  isAnswering: boolean;
  showIntro: boolean;
  crisisActive: boolean;
  nebulaDissolveTargets: [number, number, number][];
  addStar: (answer: string) => void;
  selectStar: (star: Star | null) => void;
  setAnswering: (v: boolean) => void;
  dismissIntro: () => void;
  clearCrisis: () => void;
}

export const useUniverse = create<UniverseState>()(
  persist(
    (set, get) => ({
  stars: [],
  currentQuestionIndex: 0,
  selectedStar: null,
  isAnswering: false,
  showIntro: true,
  crisisActive: false,
  nebulaDissolveTargets: [],

  addStar: (answer: string) => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex >= QUESTIONS.length) return;

    const crisis = detectCrisis(answer);
    const position = randomStarPosition(currentQuestionIndex);
    const newStar: Star = {
      id: nextStarId++,
      position,
      color: starColorFromIntensity(emotionIntensity(answer)),
      size: starSizeFromLength(answer.length),
      answer,
      question: QUESTIONS[currentQuestionIndex],
      createdAt: Date.now(),
    };

    set((state) => ({
      stars: [...state.stars, newStar],
      currentQuestionIndex: state.currentQuestionIndex + 1,
      isAnswering: false,
      crisisActive: crisis,
      // 위기 감지 시엔 별 연출(성운 흩어짐)을 멈춘다 (스펙 §4-2)
      nebulaDissolveTargets: crisis
        ? state.nebulaDissolveTargets
        : [...state.nebulaDissolveTargets, position],
    }));
  },

  selectStar: (star) => set({ selectedStar: star }),
  setAnswering: (v) => set({ isAnswering: v }),
  dismissIntro: () => set({ showIntro: false }),
  clearCrisis: () => set({ crisisActive: false }),
    }),
    {
      name: "stellia-universe",
      storage: createJSONStorage(() => localStorage),
      // 영구 보존 대상만 저장 (전환 UI 상태는 제외)
      partialize: (s) => ({
        stars: s.stars,
        currentQuestionIndex: s.currentQuestionIndex,
        showIntro: s.showIntro,
        nebulaDissolveTargets: s.nebulaDissolveTargets,
      }),
      // 새로고침 후에도 id가 충돌하지 않도록 카운터 복원
      onRehydrateStorage: () => (state) => {
        if (state && state.stars.length > 0) {
          nextStarId = Math.max(...state.stars.map((s) => s.id)) + 1;
        }
      },
    }
  )
);

export { QUESTIONS, detectCrisis };
