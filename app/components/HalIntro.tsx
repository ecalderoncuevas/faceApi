"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

type HalIntroProps = {
  onComplete: () => void;
};

export default function HalIntro({ onComplete }: HalIntroProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!rootRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete,
      });

      tl.set(".hal-intro", { opacity: 1 })
        .fromTo(
          ".hal-eye",
          { scale: 0.65, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.2, ease: "power4.out" }
        )
        .fromTo(
          ".hal-lid-top",
          { yPercent: 0 },
          { yPercent: -120, duration: 1.1 },
          "<"
        )
        .fromTo(
          ".hal-lid-bottom",
          { yPercent: 0 },
          { yPercent: 120, duration: 1.1 },
          "<"
        )
        .fromTo(
          ".hal-glow",
          { scale: 0.7, opacity: 0 },
          { scale: 1.05, opacity: 1, duration: 1 },
          "-=0.6"
        )
        .fromTo(
          ".hal-intro-text",
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.2"
        )
        .to(".hal-intro-text", { opacity: 0, duration: 0.4 }, "+=0.8")
        .to(".hal-intro", { opacity: 0, duration: 0.9 }, "-=0.1")
        .set(".hal-intro", { display: "none" });
    }, rootRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div
      ref={rootRef}
      className="hal-intro fixed inset-0 z-[60] grid place-items-center bg-black text-white"
    >
      <div className="relative flex flex-col items-center gap-6">
        <div className="hal-eye relative grid h-64 w-64 place-items-center">
          <div className="hal-glow absolute inset-0 rounded-full" />
          <div className="hal-lens-core absolute inset-10 rounded-full" />
          <div className="hal-lens-ring absolute inset-6 rounded-full" />

          <div className="hal-lid hal-lid-top absolute left-0 right-0 top-0 h-1/2 bg-black" />
          <div className="hal-lid hal-lid-bottom absolute bottom-0 left-0 right-0 h-1/2 bg-black" />
        </div>

        <div className="hal-intro-text text-center">
          <p className="font-display text-2xl tracking-[0.3em]">HAL 9000</p>
          <p className="mt-2 text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Apertura del núcleo ocular
          </p>
        </div>
      </div>
    </div>
  );
}
