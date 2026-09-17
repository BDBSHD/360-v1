import { useEffect, useState } from "react";
import { LOGO_URL } from "@/tour-data";

type Props = {
  progress: number;
  ready: boolean;
};

export default function LoadingScreen({ progress, ready }: Props) {
  const [hidden, setHidden] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    const target = Math.round(progress * 100);
    setDisplayProgress((prev) => {
      if (target > prev) return target;
      return prev;
    });
  }, [progress]);

  useEffect(() => {
    if (ready) {
      setDisplayProgress(100);
      const timer = setTimeout(() => setHidden(true), 800);
      return () => clearTimeout(timer);
    }
  }, [ready]);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a1628] transition-opacity duration-700 ${
        ready ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0, 212, 255, 0.15) 0%, transparent 60%)",
        }}
      />

      {/* Logo */}
      <div className="relative z-10 mb-12 animate-fade-in">
        <img
          src={LOGO_URL}
          alt="EMAV"
          className="h-16 w-auto opacity-90"
        />
      </div>

      {/* Spinner */}
      <div className="relative z-10 mb-8">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-2 border-slate-700/50" />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400"
            style={{ animation: "spin 1s linear infinite" }}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 w-64">
        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-500 font-medium tracking-wider uppercase">
            Carregant visita
          </span>
          <span className="text-xs text-cyan-400 font-semibold tabular-nums">
            {displayProgress}%
          </span>
        </div>
      </div>

      {/* Subtitle */}
      <div className="relative z-10 mt-8 text-center">
        <p className="text-sm text-slate-500 font-light tracking-wide">
          Visita 360° · Experiència immersiva
        </p>
      </div>
    </div>
  );
}
