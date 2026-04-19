"use client";
import React from "react";
import { Square, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  isLoading: boolean;
  isDisabled: boolean;
  onAbort?: () => void;
  onSubmit?: () => void;
  className?: string;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  isLoading,
  isDisabled,
  onAbort,
  onSubmit,
  className,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (isLoading && onAbort) {
      e.preventDefault();
      onAbort();
    } else if (!isLoading && onSubmit && !isDisabled) {
      e.preventDefault();
      onSubmit();
    }
  };

  const canSubmit = !isDisabled && !isLoading;

  return (
    <button
      type={isLoading ? "button" : "submit"}
      onClick={handleClick}
      disabled={!isLoading && isDisabled}
      aria-label={isLoading ? "Stop generating" : "Send message"}
      className={cn(
        "flex cursor-pointer items-center justify-center rounded p-2 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        isLoading &&
          "bg-muted-foreground/10 text-foreground hover:bg-muted-foreground/15",
        !isLoading &&
          canSubmit &&
          "bg-brand text-brand-foreground hover:bg-brand/90",
        !isLoading &&
          !canSubmit &&
          "cursor-not-allowed bg-muted-foreground/10 text-muted-foreground/50",
        className,
      )}
    >
      {isLoading ? (
        <Square className="size-4 fill-current" />
      ) : (
        <ArrowUp className="size-4" strokeWidth={2.5} />
      )}
    </button>
  );
};
