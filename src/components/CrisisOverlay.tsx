"use client";

import { useUniverse } from "@/store/universe";

// 위기 신호 감지 시 표시 (스펙 §4-2). 별 연출을 멈추고 조용한 단색으로 전환,
// 상담 연락처를 한 번의 탭으로 연결. 강제로 가두지 않고 우주로 돌아갈 수 있다.
export default function CrisisOverlay() {
  const crisisActive = useUniverse((s) => s.crisisActive);
  const clearCrisis = useUniverse((s) => s.clearCrisis);

  if (!crisisActive) return null;

  return (
    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-10 bg-[#0b0d12] px-8 text-center">
      <p
        className="text-lg leading-loose text-white/90"
        style={{ fontFamily: "serif" }}
      >
        지금 많이 힘든 마음이 보여요.
        <br />
        혼자 두지 않을게요.
      </p>

      <div className="flex w-full max-w-xs flex-col gap-4">
        <ContactRow
          name="자살예방상담전화"
          number="109"
          note="24시간"
          tel="tel:109"
          sms="sms:109"
        />
        <ContactRow
          name="정신건강위기상담전화"
          number="1577-0199"
          tel="tel:1577-0199"
          sms="sms:1577-0199"
        />
      </div>

      <button
        onClick={clearCrisis}
        className="mt-2 text-sm tracking-widest text-white/40 transition-colors hover:text-white/60"
      >
        괜찮아요, 돌아갈게요
      </button>
    </div>
  );
}

function ContactRow({
  name,
  number,
  note,
  tel,
  sms,
}: {
  name: string;
  number: string;
  note?: string;
  tel: string;
  sms: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-white/70">{name}</span>
        {note && <span className="text-[11px] text-white/30">{note}</span>}
      </div>
      <div className="mt-1 text-xl tracking-wider text-white/90" style={{ fontFamily: "serif" }}>
        {number}
      </div>
      <div className="mt-3 flex gap-2">
        <a
          href={tel}
          className="flex-1 rounded-full border border-white/15 py-2 text-center text-xs text-white/70 hover:border-white/30"
        >
          통화
        </a>
        <a
          href={sms}
          className="flex-1 rounded-full border border-white/15 py-2 text-center text-xs text-white/70 hover:border-white/30"
        >
          문자
        </a>
      </div>
    </div>
  );
}
