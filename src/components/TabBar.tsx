"use client";

import { useNavigation, type Screen } from "@/store/navigation";

const TABS: { id: Screen; label: string; icon: React.ReactNode }[] = [
  {
    id: "universe",
    label: "우주",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.2" />
        <ellipse
          cx="12"
          cy="12"
          rx="11"
          ry="4"
          stroke="currentColor"
          strokeWidth="1.2"
          transform="rotate(-22 12 12)"
        />
      </svg>
    ),
  },
  {
    id: "journal",
    label: "일지",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path
          d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <path d="M9 9h6M9 13h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "설정",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" />
        <path
          d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3M18 6l-1.8 1.8M7.8 16.2 6 18M18 18l-1.8-1.8M7.8 7.8 6 6"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function TabBar() {
  const { screen, goTo } = useNavigation();

  return (
    <nav className="absolute bottom-0 inset-x-0 z-50 flex justify-center pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="flex items-stretch gap-1 rounded-full border border-white/10 bg-black/40 px-2 py-1.5 backdrop-blur-md">
        {TABS.map((tab) => {
          const active = screen === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => goTo(tab.id)}
              className={`flex w-16 flex-col items-center gap-1 rounded-full py-1.5 text-[10px] tracking-widest transition-colors ${
                active ? "text-white/90" : "text-white/35 hover:text-white/60"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
