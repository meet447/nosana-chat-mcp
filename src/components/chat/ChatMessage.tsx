/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { memo, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ToolExecDialog } from "./ToolExecDialog";
import { useChatStore } from "@/store/chat.store";
import { useSettingsStore } from "@/store/setting.store";
import MarkdownComponent from "./MarkdownComponent";
import FollowUP from "./FollowUps";
import { UserMessage } from "./UserMessage";
import { ReasoningSection } from "./ReasoningSection";
import { SearchResultsSection } from "./SearchResultsSection";
import { MessageToolbar } from "./AiMessageToolBar";
import { AgentTrace } from "./AgentTrace";
import { StreamContent } from "./StreamContent";
import { StreamingHeader } from "./StreamingHeader";
import PermissionRequest from "../UserPermission";
import { useShallow } from "zustand/shallow";

interface ChatMessageProps {
  msg: any;
  index?: number;
  conversations?: any[];
  setQuery?: (q: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  onSubmit?: (question: string) => void;
  isStreaming?: boolean;
  event?: string;
  hasNormalResponseStarted?: boolean;
}

const contentStyle: React.CSSProperties = {
  paddingLeft: "5px",
  paddingRight: "5px",
  margin: "0px",
  backgroundColor: "transparent",
};

const ChatMessage = memo(function ChatMessage({
  msg,
  index,
  conversations = [],
  setQuery,
  textareaRef,
  onSubmit,
  isStreaming = false,
  event,
  hasNormalResponseStarted = false,
}: ChatMessageProps) {
  const { tool, pendingPermission } = useChatStore(
    useShallow((s) => ({
      tool: s.tool,
      pendingPermission: s.pendingPermission,
    })),
  );
  const appearance = useSettingsStore((s) => s.localConfig.appearance);

  useEffect(() => {
    if (appearance === "dark") {
      import("highlight.js/styles/atom-one-dark.css");
    } else {
      import("highlight.js/styles/github.css");
    }
  }, [appearance]);

  const markdownComponents = useMemo(
    () => ({
      table({ ...props }: any) {
        return (
          <div style={{ overflowX: "auto", maxWidth: "100%" }}>
            <table {...props} className="markdown-table" />
          </div>
        );
      },
    }),
    [],
  );

  if (msg.role === "user") return <UserMessage msg={msg} />;

  const hasStreamItems =
    Array.isArray(msg.streamItems) && msg.streamItems.length > 0;
  const isLastInConversation =
    typeof index === "number" && index === conversations.length - 1;

  return (
    <div className="mt-3 mb-3 flex justify-start">
      <div className="flex w-full flex-col gap-1.5 px-3 sm:px-2">
        {msg.reasoning ? (
          <ReasoningSection
            reasoning={msg.reasoning}
            isStreaming={isStreaming}
            hasNormalResponseStarted={hasNormalResponseStarted}
          />
        ) : null}

        {!isStreaming && msg.search && msg.search.length > 0 ? (
          <SearchResultsSection search={msg.search} />
        ) : null}

        {isStreaming && <StreamingHeader event={event} />}

        {hasStreamItems ? (
          <div
            style={contentStyle}
            className="markdown-container markdown-body max-w-none rounded-lg text-sm"
          >
            <StreamContent
              items={msg.streamItems}
              markdownComponents={markdownComponents}
              isStreaming={isStreaming}
            />
          </div>
        ) : (
          <>
            {!isStreaming && msg.trace && msg.trace.length > 0 && (
              <AgentTrace trace={msg.trace} />
            )}
            <div
              style={contentStyle}
              className="markdown-container markdown-body max-w-none rounded-lg text-sm"
            >
              {isStreaming ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
                  components={markdownComponents}
                >
                  {msg.content || ""}
                </ReactMarkdown>
              ) : (
                <MarkdownComponent msg={msg} />
              )}
            </div>
          </>
        )}

        {isStreaming && pendingPermission && (
          <PermissionRequest
            toolName={pendingPermission.toolName}
            args={pendingPermission.args}
            onAllow={pendingPermission.onAllow}
            onDeny={pendingPermission.onDeny}
          />
        )}

        {!isStreaming && tool && isLastInConversation && <ToolExecDialog />}

        {!isStreaming && <MessageToolbar msg={msg} tool={tool} />}

        {!isStreaming &&
          msg.followUps?.length > 0 &&
          isLastInConversation && (
            <FollowUP
              textareaRef={textareaRef as any}
              followUPs={msg.followUps}
              setQuery={setQuery || (() => {})}
              onSubmit={onSubmit}
            />
          )}
      </div>
    </div>
  );
});

export default ChatMessage;
