"use client";

import dynamic from "next/dynamic";
import QuestionOverlay from "@/components/QuestionOverlay";
import StarCard from "@/components/StarCard";
import HUD from "@/components/HUD";

const Universe = dynamic(() => import("@/components/Universe"), { ssr: false });

export default function Home() {
  return (
    <main className="fixed inset-0 bg-black">
      <Universe />
      <HUD />
      <QuestionOverlay />
      <StarCard />
    </main>
  );
}
