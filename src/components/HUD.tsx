"use client";

import { useUniverse, QUESTIONS } from "@/store/universe";

export default function HUD() {
  const { currentQuestionIndex, isAnswering, setAnswering, showIntro, dismissIntro } =
    useUniverse();

  const allDone = currentQuestionIndex >= QUESTIONS.length;

  if (showIntro) {
    return (
      <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-40">
        <div className="max-w-md mx-6 flex flex-col items-center gap-8 text-center">
          <h1 className="text-white/90 text-2xl tracking-widest font-light">
            Stellia
          </h1>
          <p
            className="text-white/60 text-base leading-relaxed font-light"
            style={{ fontFamily: "serif" }}
          >
            당신의 우주는 아직 성운에 싸여 있어요.
            <br />
            별은 이미 그 안에 있고요.
          </p>
          <button
            onClick={dismissIntro}
            className="text-white/40 text-sm hover:text-white/60 transition-colors mt-4 tracking-widest"
          >
            시작하기
          </button>
        </div>
      </div>
    );
  }

  if (isAnswering) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 flex flex-col items-center gap-4 pb-10 pointer-events-none z-10">
      {!allDone && (
        <button
          onClick={() => setAnswering(true)}
          className="pointer-events-auto text-white/40 text-sm hover:text-white/60 transition-colors tracking-widest border border-white/10 hover:border-white/20 rounded-full px-6 py-3"
        >
          성운을 흩어볼까요
        </button>
      )}
      {allDone && (
        <p className="text-white/30 text-xs tracking-widest">
          드러낸 별을 탭해 보세요
        </p>
      )}
    </div>
  );
}
