"use client";
import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onFocus,
  onKeyDown,
  placeholder = "Type your message...",
  className,
  textareaRef,
}) => {
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const actualRef = textareaRef || internalTextareaRef;

  useEffect(() => {
    const resizeTextarea = () => {
      if (actualRef.current) {
        actualRef.current.style.height = "auto";
        actualRef.current.style.height = Math.min(actualRef.current.scrollHeight, 256) + "px";
      }
    };

    resizeTextarea();
  }, [value, actualRef]);

  const handleFocus = () => {
    onFocus?.();
  };

  return (
    <textarea
      ref={actualRef}
      placeholder={placeholder}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={handleFocus}
      onKeyDown={onKeyDown}
      className={cn(
        "min-h-12 w-full resize-none bg-transparent p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none sm:min-h-16 sm:p-3",
        className,
      )}
    />
  );
};
