import React from "react";
import { cn } from "@/lib/utils";

interface StreamingHeaderProps {
  event?: string;
  className?: string;
}

export function StreamingHeader({ event, className }: StreamingHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 text-xs text-muted-foreground/60",
        className,
      )}
    >
      <PulseDot />
      <span>{event || "streaming..."}</span>
    </div>
  );
}

function PulseDot() {
  return (
    <span
      aria-hidden
      className="inline-block h-2 w-2 rounded-full bg-brand/60"
      style={{ animation: "pulseScale 1s ease-in-out infinite" }}
    >
      <style>{`
        @keyframes pulseScale {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.6); opacity: 1; }
        }
      `}</style>
    </span>
  );
}
