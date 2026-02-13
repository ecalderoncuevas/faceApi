"use client";

import { useState } from "react";
import FaceCam from "./components/FaceCam";
import HalIntro from "./components/HalIntro";
import ResultScreen from "./components/ResultScreen";
import { Badge } from "./components/ui/badge";

type ResultData = {
  success: boolean;
  confidence?: number;
  message?: string;
  detail?: string;
};

export default function Page() {
  const [stage, setStage] = useState<"identify" | "result">("identify");
  const [result, setResult] = useState<ResultData | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  const handleIdentificationComplete = (data: ResultData) => {
    setResult(data);
    setStage("result");
  };

  const handleRetry = () => {
    setResult(null);
    setStage("identify");
  };

  const handleChangeUser = () => {
    localStorage.removeItem("face_descriptor_demo");
    setResult(null);
    setStage("identify");
  };

  const handleLogout = () => {
    setResult(null);
    setStage("identify");
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {showIntro && <HalIntro onComplete={() => setShowIntro(false)} />}
      <div className="absolute inset-0 hal-grid opacity-30" />
      <div className="absolute inset-0 hal-vignette" />

      <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-red-600/15 blur-[140px]" />
      <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-red-500/10 blur-[140px]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="px-6 pt-10 pb-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-3">
                  <h1 className="font-display text-4xl md:text-6xl tracking-tight">
                    HAL <span className="text-red-600">9000</span>
                  </h1>
                  <Badge variant="secondary">Neural Core Online</Badge>
                </div>
                <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">
                  Odyssey Identity Protocol
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
                <span>Canal seguro activo</span>
              </div>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
          </div>
        </header>

        <main className="flex-1 px-6 pb-12">
          <div className="mx-auto max-w-6xl">
            {stage === "result" && result ? (
              <ResultScreen
                result={result}
                onRetry={handleRetry}
                onChangeUser={handleChangeUser}
                onLogout={handleLogout}
              />
            ) : (
              <FaceCam onComplete={handleIdentificationComplete} />
            )}
          </div>
        </main>

        <footer className="px-6 pb-8">
          <div className="mx-auto max-w-6xl text-xs text-muted-foreground">
            HAL 9000 • Face API Session • Vercel Deployment Ready
          </div>
        </footer>
      </div>
    </div>
  );
}
