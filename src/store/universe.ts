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

// 스펙 §9-3 질문 풀 52주 (관찰기 → 연결기 → 재구성기)
const QUESTIONS = [
  // 관찰기 (1-12)
  "이번 주, 가장 오래 머문 생각은 뭔가요?",
  "요즘 자주 하는 말이 있다면?",
  "이번 주 마음이 바빴던 순간은 언제였나요?",
  "오늘 하루 중 가장 먼저 떠오르는 장면은?",
  "최근 누군가에게 하고 싶었지만 안 한 말이 있나요?",
  "이번 주 나를 가장 오래 붙잡은 감정은?",
  "혼자일 때 자주 하는 생각이 있다면?",
  "요즘 피하고 있는 것이 있나요?",
  "이번 주 나를 웃게 한 건 뭐였나요?",
  "자주 비교하게 되는 것이 있나요?",
  "요즘 나에게 가장 중요한 한 가지는?",
  "이번 달, 나에게 가장 큰 일은 뭐였나요?",
  // 연결기 (13-32)
  "지난번 답을 다시 읽어봤어요. 지금도 같은 생각인가요?",
  "반복되는 생각이 있다면, 그건 언제 시작됐나요?",
  "내가 자주 쓰는 “~해야 한다”는 표현이 있나요?",
  "힘들 때 나는 보통 어떻게 하나요?",
  "나를 가장 잘 아는 사람은 나에 대해 뭐라고 할까요?",
  "요즘 가장 많이 느끼는 감정의 반대는 뭘까요?",
  "내가 편한 사람과 불편한 사람의 차이는?",
  "이번 달, 예상과 다르게 흘러간 일이 있나요?",
  "나를 화나게 하는 것과 슬프게 하는 것의 공통점은?",
  "어릴 때의 나는 지금의 나를 보면 뭐라고 할까요?",
  "요즘 가장 자주 미루는 건 뭔가요? 왜 미루는 것 같아요?",
  "나에게 “괜찮다”고 말할 때, 진짜 괜찮은 건가요?",
  "최근 내 기분을 가장 크게 바꾼 한마디는?",
  "내가 남에게 잘 해주는 것 중 나에게는 안 하는 게 있나요?",
  "요즘 내가 가장 원하는 건 뭔가요? 진짜로?",
  "같은 상황인데 기분이 다를 때가 있었나요? 뭐가 달랐을까요?",
  "내가 통제할 수 있는 것과 없는 것을 나눠본다면?",
  "나에게 가장 무거운 '해야 한다'는 뭔가요?",
  "이 한 달간의 내 별들을 보면 어떤 느낌이 드나요?",
  "내가 반복하는 패턴 하나를 고른다면?",
  // 재구성기 (33-52)
  "그때 다르게 생각할 수 있었다면?",
  "내가 나에게 하는 말을 친구에게도 할 수 있나요?",
  "지금의 나에게 편지를 쓴다면 첫 문장은?",
  "내가 두려워하는 것이 실제로 일어난 적 있나요?",
  "“나는 ~한 사람이다”를 다시 쓴다면?",
  "과거의 힘든 일이 지금의 나에게 준 게 있다면?",
  "내 걱정 중 실제로 일어난 비율은 어느 정도일까요?",
  "완벽하지 않아도 괜찮았던 순간이 있나요?",
  "남에게는 관대한데 나에게는 엄격한 기준이 있나요?",
  "지금 가장 놓아주고 싶은 생각은?",
  "1년 전의 나에게 해주고 싶은 말은?",
  "내가 가장 자랑스러운 순간은 언제였나요?",
  "실패라고 생각했는데 지금 보면 다른 게 있나요?",
  "내 약점이라고 생각하는 것이 장점이 될 때가 있나요?",
  "지금 이 순간, 충분한 것 세 가지는?",
  "내년의 나에게 바라는 한 가지는?",
  "이 우주를 처음 본 사람에게 뭐라고 소개하겠어요?",
  "지금까지의 답을 읽으며 발견한 것이 있나요?",
  "내가 변한 것과 변하지 않은 것은?",
  "오래전 드러낸 첫 별을 다시 봅니다. 그때의 나에게 한마디.",
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
  // 황금각으로 흩뿌려 답이 쌓일수록 우주 전체에 고르게 퍼지게 한다
  const angle = index * 2.39996 + (Math.random() - 0.5) * 0.6;
  const radius = 5 + Math.random() * 9;
  return [
    Math.cos(angle) * radius,
    (Math.random() - 0.5) * 6,
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
