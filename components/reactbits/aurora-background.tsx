"use client";

// ReactBits-inspired "Aurora" animated background — self-contained (no deps).
// Soft, drifting radial gradients. Renders behind its children.

interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export function AuroraBackground({
  className = "",
  children,
}: AuroraBackgroundProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <style>{`
        @keyframes sd-aurora-1 { 0%,100% { transform: translate(-10%, -10%) scale(1); } 50% { transform: translate(15%, 10%) scale(1.25); } }
        @keyframes sd-aurora-2 { 0%,100% { transform: translate(10%, 5%) scale(1.1); } 50% { transform: translate(-15%, -10%) scale(1); } }
        @keyframes sd-aurora-3 { 0%,100% { transform: translate(0%, 15%) scale(1); } 50% { transform: translate(10%, -12%) scale(1.2); } }
      `}</style>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute -top-1/3 -left-1/4 h-[70vh] w-[70vh] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at center, #6366f1, transparent 60%)",
            animation: "sd-aurora-1 14s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-1/4 right-0 h-[60vh] w-[60vh] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at center, #d946ef, transparent 60%)",
            animation: "sd-aurora-2 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-0 left-1/3 h-[55vh] w-[55vh] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle at center, #22d3ee, transparent 60%)",
            animation: "sd-aurora-3 20s ease-in-out infinite",
          }}
        />
      </div>
      {children}
    </div>
  );
}
