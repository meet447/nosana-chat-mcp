"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRightFromLine,
  LayoutGrid,
  Moon,
  Sun,
  Pencil,
} from "lucide-react";
import { useChatStore } from "@/store/chat.store";
import { useSettingsStore } from "@/store/setting.store";
import { cn } from "@/lib/utils";
import { TemplatePopUP } from "./TemplatePop";
import { useShallow } from "zustand/shallow";

interface ChatNavBarProps {
  className?: string;
  onTemplateSelect?: (jobDefinition: Record<string, any>) => void;
}

function ChatNavBar({ className, onTemplateSelect }: ChatNavBarProps) {
  const { selectedChatId, chatHistory, updateThreadTitle, tool } = useChatStore(
    useShallow((s) => ({
      selectedChatId: s.selectedChatId,
      chatHistory: s.chatHistory,
      updateThreadTitle: s.updateThreadTitle,
      tool: s.tool,
    })),
  );
  const {
    toggleMobile,
    toggleTemplate,
    templateOpen,
    appearance,
    toggleAppearance,
  } = useSettingsStore(
    useShallow((s) => ({
      toggleMobile: s.toggleMobile,
      toggleTemplate: s.toggleTemplate,
      templateOpen: s.templateOpen,
      appearance: s.localConfig.appearance,
      toggleAppearance: s.toggleAppearance,
    })),
  );

  const currentThread = selectedChatId
    ? chatHistory.find((c) => c.thread_id === selectedChatId)
    : null;
  const currentTitle = currentThread?.thread_title ?? "";

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(currentTitle);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(currentTitle);
  }, [currentTitle]);

  const beginEdit = () => {
    if (!selectedChatId) return;
    setDraft(currentTitle);
    setIsEditing(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const commit = () => {
    const next = draft.trim();
    if (!selectedChatId) {
      setIsEditing(false);
      return;
    }
    if (next && next !== currentTitle) {
      updateThreadTitle(selectedChatId, next);
    } else {
      setDraft(currentTitle);
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setDraft(currentTitle);
    setIsEditing(false);
  };

  const titleLabel = currentTitle || (selectedChatId ? "New chat" : "");
  const isDeployer = tool === "deployer";

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-40 flex h-14 w-full shrink-0 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          className,
        )}
      >
        <button
          onClick={() => toggleMobile()}
          type="button"
          aria-label="Open sidebar"
          className="relative z-10 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted-foreground/10 touch-manipulation lg:hidden"
        >
          <ArrowRightFromLine className="size-5" />
        </button>

        <div className="relative flex min-w-0 flex-1 items-center">
          {isEditing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancel();
                }
              }}
              className="h-8 w-full max-w-md rounded-md border border-border/60 bg-background px-2 text-sm text-foreground outline-none focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
              aria-label="Chat title"
            />
          ) : titleLabel ? (
            <button
              type="button"
              onClick={beginEdit}
              className="group flex min-w-0 max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-left transition-colors hover:bg-muted-foreground/10"
              aria-label="Rename chat"
              title="Rename chat"
            >
              <span className="truncate text-sm font-medium text-foreground">
                {titleLabel}
              </span>
              <Pencil className="size-3 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
            </button>
          ) : (
            isDeployer && (
              <span className="truncate px-2 text-sm text-muted-foreground">
                Deployer
              </span>
            )
          )}
        </div>

        <div className="relative z-10 flex items-center gap-1">
          {isDeployer && (
            <button
              onClick={() => toggleTemplate()}
              type="button"
              aria-label="Toggle deployment templates"
              aria-pressed={templateOpen}
              className={cn(
                "rounded-md p-2 transition-colors touch-manipulation",
                templateOpen
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground",
              )}
              title="Deployment templates"
            >
              <LayoutGrid className="size-5" />
            </button>
          )}

          <button
            onClick={() => toggleAppearance()}
            type="button"
            aria-label={
              appearance === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted-foreground/10 hover:text-foreground touch-manipulation"
            title={
              appearance === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {appearance === "dark" ? (
              <Sun className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
          </button>
        </div>
      </div>

      {templateOpen && onTemplateSelect && (
        <TemplatePopUP
          toggleTemplate={toggleTemplate}
          onSelectTemplate={onTemplateSelect}
        />
      )}
    </>
  );
}

export default ChatNavBar;
