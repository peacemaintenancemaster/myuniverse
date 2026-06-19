"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import QuestionOverlay from "@/components/QuestionOverlay";
import StarCard from "@/components/StarCard";
import HUD from "@/components/HUD";
import TabBar from "@/components/TabBar";
import CrisisOverlay from "@/components/CrisisOverlay";
import JournalScreen from "@/components/screens/JournalScreen";
import SettingsScreen from "@/components/screens/SettingsScreen";
import { useNavigation } from "@/store/navigation";
import { useUniverse } from "@/store/universe";

const Universe = dynamic(() => import("@/components/Universe"), { ssr: false });

export default function Home() {
  const screen = useNavigation((s) => s.screen);
  const showIntro = useUniverse((s) => s.showIntro);

  // 저장된 기록이 클라이언트에서 복원되므로, 마운트 후 렌더해 하이드레이션 불일치를 피한다
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-[100dvh] w-full bg-neutral-950" />;

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-neutral-950">
      {/* 폰 프레임 — 데스크톱에서도 모바일 뷰로 가둔다 */}
      <main className="relative h-full w-full overflow-hidden bg-black md:h-[860px] md:max-h-[94vh] md:w-[400px] md:rounded-[2.4rem] md:border md:border-white/10 md:shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        {/* 우주는 항상 떠 있는 배경 (리마운트 비용을 피함) */}
        <Universe />

        {/* 우주 화면에서만 보이는 오버레이 */}
        {screen === "universe" && (
          <>
            <HUD />
            <QuestionOverlay />
          </>
        )}

        {/* 탭으로 덮이는 화면 */}
        {screen === "journal" && <JournalScreen />}
        {screen === "settings" && <SettingsScreen />}

        {/* 기억 카드는 어느 화면에서 별을 탭하든 뜬다 */}
        <StarCard />

        {/* 위기 안전장치 — 최상단, 어느 화면에서든 */}
        <CrisisOverlay />

        {/* 온보딩 중에는 탭바를 숨긴다 */}
        {!showIntro && <TabBar />}
      </main>
    </div>
  );
}
