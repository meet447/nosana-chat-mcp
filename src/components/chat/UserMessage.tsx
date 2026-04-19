import React from "react";
import { CopyButton } from "../ui/shadcn-io/copy-button";
import { cn } from "@/lib/utils";

interface UserMessageProps {
  msg: {
    id?: string;
    content: string;
    role?: string;
  };
}

export function UserMessage({ msg }: UserMessageProps) {
  return (
    <div
      className="group mt-6 mb-1 flex scroll-mt-20 flex-col items-end px-3 sm:px-2"
      data-message-id={msg.id}
    >
      <div
        className={cn(
          "relative max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed text-foreground",
          "bg-muted border border-border/60 shadow-sm",
        )}
      >
        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
      </div>
      <CopyButton
        content={msg.content}
        variant="default"
        className={cn(
          "mt-1 h-6 rounded bg-transparent p-1 text-muted-foreground/0 transition-opacity hover:bg-muted-foreground/10 hover:text-foreground",
          "group-hover:text-muted-foreground/70 focus-visible:text-muted-foreground/70",
        )}
      />
    </div>
  );
}
