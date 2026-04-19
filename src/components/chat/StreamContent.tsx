"use client";

import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { cn } from "@/lib/utils";
import { TraceEvent } from "@/store/chat.store";
import "../../styles/markdown.css";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface StreamItem {
  id: string;
  type: "text" | "trace";
  data: string | TraceEvent;
  timestamp: number;
}

interface StreamContentProps {
  items: StreamItem[];
  markdownComponents?: any;
  isStreaming?: boolean;
}

export const StreamContent = memo(function StreamContent({
  items,
  markdownComponents,
  isStreaming = false,
}: StreamContentProps) {
  if (items.length === 0) return null;

  const getTraceKey = (trace: TraceEvent) =>
    trace.traceId || trace.toolCallId || `${trace.toolName}-${trace.timestamp}`;

  // Pre-compute map: traceKey -> tool_result timestamp (O(n) once)
  const completedTools = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      if (
        item.type === "trace" &&
        (item.data as TraceEvent).type === "tool_result"
      ) {
        const trace = item.data as TraceEvent;
        const key = getTraceKey(trace);
        const existing = map.get(key) || 0;
        if (trace.timestamp > existing) {
          map.set(key, trace.timestamp);
        }
      }
    }
    return map;
  }, [items]);

  // Build segments: interleave text chunks with trace items
  const segments = useMemo(() => {
    const result: { type: "text" | "trace"; content: any }[] = [];
    let currentText = "";

    for (const item of items) {
      if (item.type === "text") {
        currentText += item.data as string;
      } else {
        if (currentText) {
          result.push({ type: "text", content: currentText });
          currentText = "";
        }
        result.push({ type: "trace", content: item.data });
      }
    }

    if (currentText) {
      result.push({ type: "text", content: currentText });
    }
    return result;
  }, [items]);

  return (
    <>
      {segments.map((segment, idx) => {
        if (segment.type === "text") {
          return (
            <ReactMarkdown
              key={idx}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
              components={markdownComponents}
            >
              {segment.content}
            </ReactMarkdown>
          );
        }
        const traceData = segment.content as TraceEvent;
        const traceKey = getTraceKey(traceData);
        // Skip tool_start if its tool_result has already arrived (O(1) lookup)
        if (
          traceData.type === "tool_start" &&
          (completedTools.get(traceKey) || 0) > traceData.timestamp
        ) {
          return null;
        }
        const isCompleted =
          (completedTools.get(traceKey) || 0) > traceData.timestamp;
        const showLoading =
          isStreaming &&
          traceData.type === "tool_start" &&
          !isCompleted;

        return (
          <TraceItem key={idx} trace={traceData} isStreaming={showLoading} />
        );
      })}
      {isStreaming && (
        <span className="inline-block w-1 h-4 bg-primary/50 animate-pulse ml-1 align-middle" />
      )}
    </>
  );
});

interface TraceItemProps {
  trace: TraceEvent;
  isStreaming?: boolean;
}

function formatDuration(ms?: number) {
  if (!ms) return null;
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function TraceRow({
  icon,
  nameNode,
  metaNode,
  expandable,
  expanded,
  onToggle,
  rowClass,
}: {
  icon: React.ReactNode;
  nameNode: React.ReactNode;
  metaNode?: React.ReactNode;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  rowClass?: string;
}) {
  const commonClass = cn(
    "group/trace flex w-full items-center gap-2.5 rounded px-2 py-1 text-left transition-colors",
    expandable && "cursor-pointer hover:bg-muted-foreground/5",
    rowClass,
  );

  const content = (
    <>
      <span className="flex size-4 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2 text-[13px]">
        {nameNode}
      </span>
      {metaNode}
      {expandable && (
        <span className="shrink-0 text-muted-foreground/40">
          {expanded ? (
            <ChevronDown size={13} />
          ) : (
            <ChevronRight size={13} />
          )}
        </span>
      )}
    </>
  );

  if (expandable) {
    return (
      <button type="button" onClick={onToggle} className={commonClass}>
        {content}
      </button>
    );
  }
  return <div className={commonClass}>{content}</div>;
}

const TraceItem = memo(function TraceItem({
  trace,
  isStreaming = false,
}: TraceItemProps) {
  const [expanded, setExpanded] = React.useState(false);

  if (trace.type === "tool_start") {
    return (
      <TraceRow
        icon={
          <span
            className={cn(
              "size-1.5 rounded-full bg-brand/80",
              isStreaming && "animate-pulse",
            )}
          />
        }
        nameNode={
          <>
            <span className="truncate font-medium text-foreground/80">
              {trace.toolName}
            </span>
            {trace.toolArgs && Object.keys(trace.toolArgs).length > 0 && (
              <span className="truncate text-xs text-muted-foreground/50">
                ({Object.keys(trace.toolArgs).slice(0, 2).join(", ")}
                {Object.keys(trace.toolArgs).length > 2 && "…"})
              </span>
            )}
          </>
        }
        metaNode={
          <span className="text-xs text-muted-foreground/40">running…</span>
        }
      />
    );
  }

  if (trace.type === "tool_result") {
    const duration = formatDuration(trace.duration);
    return (
      <div className="flex flex-col">
        <TraceRow
          icon={<CheckCircle2 size={13} className="text-brand/80" />}
          nameNode={
            <span className="truncate font-medium text-foreground/80">
              {trace.toolName}
            </span>
          }
          metaNode={
            duration ? (
              <span className="shrink-0 text-xs text-muted-foreground/40">
                {duration}
              </span>
            ) : null
          }
          expandable={Boolean(trace.toolResult)}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        />

        {expanded && trace.toolResult ? (
          <div className="ml-6 mt-1 rounded-md border border-border/40 bg-muted/40 p-2">
            <pre className="max-h-48 overflow-auto rounded bg-background/50 p-2 text-[11px] font-mono text-foreground/80">
              {String(JSON.stringify(trace.toolResult, null, 2))}
            </pre>
          </div>
        ) : null}
      </div>
    );
  }

  if (trace.type === "tool_error") {
    return (
      <TraceRow
        icon={<AlertCircle size={13} className="text-red-500/80" />}
        nameNode={
          <span className="truncate font-medium text-red-500/90">
            {trace.toolName}
          </span>
        }
        metaNode={
          trace.error ? (
            <span className="shrink-0 truncate text-xs text-red-500/60">
              {trace.error}
            </span>
          ) : (
            <span className="shrink-0 text-xs text-red-500/60">failed</span>
          )
        }
      />
    );
  }

  return null;
});
