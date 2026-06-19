"use client";

type Row = { label: string; value?: string };
type Group = { title: string; rows: Row[] };

// 프로토타입 단계: 구조만. 실제 동작은 Phase 1에서 연결.
const GROUPS: Group[] = [
  {
    title: "우주",
    rows: [{ label: "닉네임", value: "이름 없는 우주" }],
  },
  {
    title: "질문",
    rows: [
      { label: "질문 요일 / 시간", value: "일요일 저녁 9시" },
      { label: "질문 빈도", value: "주 1회" },
    ],
  },
  {
    title: "알림",
    rows: [
      { label: "주간 질문", value: "켜짐" },
      { label: "별자리 · 초신성 신호", value: "켜짐" },
    ],
  },
  {
    title: "보안",
    rows: [
      { label: "앱 잠금", value: "꺼짐" },
      { label: "데이터 내보내기", value: "" },
    ],
  },
  {
    title: "계정",
    rows: [
      { label: "로그아웃", value: "" },
      { label: "탈퇴", value: "" },
    ],
  },
];

export default function SettingsScreen() {
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-black/85 backdrop-blur-md">
      <header className="px-6 pt-[max(env(safe-area-inset-top),1.5rem)] pb-2">
        <h1 className="text-sm tracking-[0.3em] text-white/40 uppercase">설정</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-28">
        {GROUPS.map((group) => (
          <section key={group.title} className="mt-8">
            <h2 className="mb-1 text-[11px] tracking-[0.2em] text-white/25">{group.title}</h2>
            <ul className="divide-y divide-white/5">
              {group.rows.map((row) => (
                <li key={row.label}>
                  <button className="flex w-full items-center justify-between py-4 text-left">
                    <span className="text-sm text-white/75">{row.label}</span>
                    <span className="text-xs text-white/35">{row.value}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="mt-12 border-t border-white/5 pt-6">
          <p className="text-[11px] leading-relaxed text-white/30">
            Stellia는 전문 상담이나 치료를 대체하지 않습니다.
          </p>
          <div className="mt-3 flex gap-4 text-[11px] text-white/25">
            <button>이용약관</button>
            <button>개인정보처리방침</button>
          </div>
        </div>
      </div>
    </div>
  );
}
