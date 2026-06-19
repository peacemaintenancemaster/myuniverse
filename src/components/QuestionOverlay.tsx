"use client";

import { useState, useEffect } from "react";
import { useUniverse, QUESTIONS } from "@/store/universe";

export default function QuestionOverlay() {
  const { currentQuestionIndex, isAnswering, addStar, setAnswering } = useUniverse();
  const [answer, setAnswer] = useState("");
  const [birthMessage, setBirthMessage] = useState<string | null>(null);
  const [fadeClass, setFadeClass] = useState("");

  const allDone = currentQuestionIndex >= QUESTIONS.length;
  const question = QUESTIONS[currentQuestionIndex];

  useEffect(() => {
    if (birthMessage) {
      setFadeClass("opacity-100");
      const t1 = setTimeout(() => setFadeClass("opacity-0"), 2500);
      const t2 = setTimeout(() => setBirthMessage(null), 3500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [birthMessage]);

  if (birthMessage) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
        <p
          className={`text-white/90 text-lg tracking-widest font-light transition-opacity duration-1000 ${fadeClass}`}
          style={{ fontFamily: "serif" }}
        >
          {birthMessage}
        </p>
      </div>
    );
  }

  if (isAnswering && !allDone) {
    return (
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-20">
        <div className="max-w-lg w-full mx-6 flex flex-col items-center gap-10">
          <p className="text-white/50 text-xs tracking-[0.3em] uppercase">
            성운을 흩어볼까요
          </p>
          <p
            className="text-white/90 text-xl text-center leading-relaxed font-light"
            style={{ fontFamily: "serif" }}
          >
            {question}
          </p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="여기에 답을 적어요..."
            maxLength={2000}
            className="w-full bg-transparent border-b border-white/20 text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-white/40 text-base leading-relaxed py-3 min-h-[100px]"
            style={{ fontFamily: "serif" }}
            autoFocus
          />
          <div className="flex gap-6">
            <button
              onClick={() => {
                setAnswering(false);
                setAnswer("");
              }}
              className="text-white/30 text-sm hover:text-white/50 transition-colors"
            >
              돌아가기
            </button>
            <button
              onClick={() => {
                if (answer.trim()) {
                  addStar(answer.trim());
                  setAnswer("");
                  // 위기 감지 시엔 CrisisOverlay가 뜨므로 별 탄생 연출을 띄우지 않는다
                  if (!useUniverse.getState().crisisActive) {
                    setBirthMessage("별 하나가 드러났어요.");
                  }
                }
              }}
              disabled={!answer.trim()}
              className="text-white/70 text-sm hover:text-white transition-colors disabled:text-white/20 disabled:cursor-default"
            >
              답하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
