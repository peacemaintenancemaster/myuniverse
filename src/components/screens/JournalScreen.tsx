"use client";

import { useMemo, useState } from "react";
import { useUniverse } from "@/store/universe";

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default function JournalScreen() {
  const stars = useUniverse((s) => s.stars);
  const selectStar = useUniverse((s) => s.selectStar);
  const [query, setQuery] = useState("");

  const entries = useMemo(() => {
    const sorted = [...stars].sort((a, b) => b.createdAt - a.createdAt);
    if (!query.trim()) return sorted;
    const q = query.trim().toLowerCase();
    return sorted.filter(
      (s) => s.answer.toLowerCase().includes(q) || s.question.toLowerCase().includes(q)
    );
  }, [stars, query]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-black/85 backdrop-blur-md">
      <header className="px-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-4">
        <h1 className="text-sm tracking-[0.3em] text-white/40 uppercase">마음 일지</h1>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="기록을 찾아봐요"
          className="mt-4 w-full border-b border-white/10 bg-transparent py-2 text-sm text-white/80 placeholder:text-white/25 focus:border-white/30 focus:outline-none"
        />
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-28">
        {entries.length === 0 ? (
          <p className="mt-24 text-center text-sm leading-loose text-white/30" style={{ fontFamily: "serif" }}>
            {stars.length === 0
              ? "아직 성운 속에 있는 별이 많아요."
              : "찾는 기록이 없어요."}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-white/5">
            {entries.map((star) => (
              <li key={star.id}>
                <button
                  onClick={() => selectStar(star)}
                  className="flex w-full flex-col items-start gap-2 py-5 text-left"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: star.color, boxShadow: `0 0 8px ${star.color}` }}
                    />
                    <span className="text-[11px] tracking-wider text-white/30">
                      {formatDate(star.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-white/40">{star.question}</p>
                  <p
                    className="line-clamp-2 text-sm leading-relaxed text-white/80"
                    style={{ fontFamily: "serif" }}
                  >
                    {star.answer}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
