"use client";

// ReactBits-inspired "Gradient Text" — an animated flowing gradient on text.

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
}

export function GradientText({
  children,
  className = "",
  colors = ["#6366f1", "#d946ef", "#22d3ee", "#6366f1"],
}: GradientTextProps) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
        backgroundSize: "300% 100%",
        animation: "sd-gradient-move 6s linear infinite",
      }}
    >
      <style>{`@keyframes sd-gradient-move { 0% { background-position: 0% 50%; } 100% { background-position: 300% 50%; } }`}</style>
      {children}
    </span>
  );
}
