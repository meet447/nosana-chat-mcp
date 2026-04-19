/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
import ChatMessage from "./ChatMessage";
import { Conversation } from "@/store/chat.store";

interface ChatMessageListProps {
  conversations: Conversation[];
  state: "idle" | "loading" | null;
  reasoningChunks: string;
  llmChunks: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  event: string;
  setQuery: (q: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onSubmit?: (question: string) => void;
  streamItems?: any[];
}

const STREAMING_ID = "__streaming__";

const ChatMessageList = memo(function ChatMessageList({
  conversations,
  state,
  reasoningChunks,
  llmChunks,
  scrollRef,
  event,
  setQuery,
  textareaRef,
  onSubmit,
  streamItems = [],
}: ChatMessageListProps) {
  const prevLen = useRef(conversations.length);
  const prevLastMessageId = useRef<string | undefined>(
    conversations[conversations.length - 1]?.id,
  );
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const lastMessage = conversations[conversations.length - 1];
    const lastMessageId = lastMessage?.id;
    const hasNewLastMessage = lastMessageId !== prevLastMessageId.current;

    if (
      conversations.length <= prevLen.current ||
      !hasNewLastMessage ||
      lastMessage?.role !== "user"
    ) {
      return;
    }

    const scrollToLatestUserMessage = () => {
      const container = scrollContainerRef.current;
      if (!container || !lastMessageId) return;

      const messageElement = container.querySelector(
        `[data-message-id="${lastMessageId}"]`,
      );

      if (!(messageElement instanceof HTMLElement)) return;

      const nextScrollTop = Math.max(messageElement.offsetTop - 8, 0);
      container.scrollTo({
        top: nextScrollTop,
        behavior: "smooth",
      });
    };

    requestAnimationFrame(scrollToLatestUserMessage);
    const retry1 = setTimeout(scrollToLatestUserMessage, 120);
    const retry2 = setTimeout(scrollToLatestUserMessage, 320);

    return () => {
      clearTimeout(retry1);
      clearTimeout(retry2);
    };
  }, [conversations]);

  useEffect(() => {
    prevLen.current = conversations.length;
    prevLastMessageId.current = conversations[conversations.length - 1]?.id;
  }, [conversations]);

  useEffect(() => {
    if (scrollRef) {
      scrollRef.current = scrollContainerRef.current;
    }
  }, [scrollRef]);

  const isStreaming = state === "loading";

  const streamingMsg = useMemo(
    () =>
      isStreaming
        ? {
            id: STREAMING_ID,
            role: "model",
            content: llmChunks,
            reasoning: reasoningChunks,
            streamItems,
          }
        : null,
    [isStreaming, llmChunks, reasoningChunks, streamItems],
  );

  const renderItem = useCallback(
    (index: number, msg: any) => (
      <ChatMessage
        key={msg.id || index}
        msg={msg}
        index={index}
        conversations={conversations}
        setQuery={setQuery}
        textareaRef={textareaRef}
        onSubmit={onSubmit}
      />
    ),
    [conversations, setQuery, textareaRef, onSubmit],
  );

  return (
    <div className="min-h-0 h-full w-full max-w-[800px] flex-1 px-1 pb-24 sm:w-[80vw] sm:px-0 sm:pb-28 md:w-[70vw] lg:w-[60vw] xl:w-[60vw]">
      <div ref={scrollContainerRef} className="h-full w-full overflow-y-auto">
        {conversations.map((msg, index) => renderItem(index, msg))}

        {streamingMsg && (
          <ChatMessage
            msg={streamingMsg}
            isStreaming
            event={event}
            hasNormalResponseStarted={
              (llmChunks?.length ?? 0) > 0 ||
              (streamItems?.length ?? 0) > 0
            }
          />
        )}

        <div className="h-4" />
      </div>
    </div>
  );
});

export default ChatMessageList;
