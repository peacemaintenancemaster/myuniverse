"use client";

import { useUniverse } from "@/store/universe";

export default function StarCard() {
  const { selectedStar, selectStar } = useUniverse();

  if (!selectedStar) return null;

  const weeksAgo = Math.max(
    0,
    Math.floor((Date.now() - selectedStar.createdAt) / (7 * 24 * 60 * 60 * 1000))
  );

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-30"
      onClick={() => selectStar(null)}
    >
      <div
        className="max-w-md w-full mx-6 rounded-2xl p-8 flex flex-col gap-6 animate-fade-in"
        style={{
          background: "rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: selectedStar.color,
              boxShadow: `0 0 12px ${selectedStar.color}`,
            }}
          />
          <span className="text-white/30 text-xs tracking-wider">
            {weeksAgo > 0
              ? `이 빛은 ${weeksAgo}주 전에 출발했어요`
              : "방금 드러난 별이에요"}
          </span>
        </div>

        <p className="text-white/40 text-sm leading-relaxed">
          {selectedStar.question}
        </p>

        <p
          className="text-white/90 text-lg leading-relaxed"
          style={{ fontFamily: "serif" }}
        >
          {selectedStar.answer}
        </p>

        <button
          onClick={() => selectStar(null)}
          className="self-end text-white/30 text-xs hover:text-white/50 transition-colors mt-2"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
