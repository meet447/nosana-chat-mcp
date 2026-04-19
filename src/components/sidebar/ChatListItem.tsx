import { memo } from "react";
import { CheckIcon, X } from "lucide-react";
import { ChatOptionsMenu } from "./ChatmenuOption";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { formatRelativeShort } from "@/lib/utils/time";

const ChatListItem = memo(
  ({
    item,
    isSelected,
    onChatClick,
    editingId,
    editContent,
    onEditSave,
    onEditCancel,
    onEditStart,
    setEditContent,
    onExport,
    onRename,
    onDelete,
    barOpen,
  }: ChatListItemProps) => {
    const isEditing = editingId === item.thread_id;
    const timestamp = item.lastUpdated ?? Number(item.thread_id);
    const relative = Number.isFinite(timestamp)
      ? formatRelativeShort(timestamp)
      : null;

    return (
      <div
        onClick={() => !isEditing && onChatClick(item.thread_id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!isEditing && (e.key === "Enter" || e.key === " ")) {
            onChatClick(item.thread_id);
            e.preventDefault();
          }
        }}
        className={cn(
          "group relative mb-0.5 flex cursor-pointer select-none items-center justify-between gap-2 rounded-md px-2 py-1.5 text-muted-foreground/80 transition-colors",
          "hover:bg-muted-foreground/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
          isSelected &&
            "bg-muted-foreground/10 text-foreground before:absolute before:inset-y-1 before:left-0 before:w-[2px] before:rounded-full before:bg-brand",
          isEditing && "bg-muted-foreground/10",
        )}
      >
        {isEditing ? (
          <div className="flex w-full items-center gap-1">
            <Input
              value={editContent}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onEditSave(item.thread_id, editContent);
                } else if (e.key === "Escape") {
                  onEditCancel();
                }
              }}
              onChange={(e) => setEditContent(e.target.value)}
              className="h-8 w-full rounded border px-2 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditSave(item.thread_id, editContent);
              }}
              aria-label="Save title"
              className="text-muted-foreground/60 transition-colors hover:text-brand"
            >
              <CheckIcon size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditCancel();
              }}
              aria-label="Cancel"
              className="text-muted-foreground/60 transition-colors hover:text-red-500"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <div
                className={cn(
                  "line-clamp-1 text-sm",
                  isSelected
                    ? "font-medium text-foreground"
                    : "text-foreground/80",
                )}
              >
                {item.thread_title ?? "New chat"}
              </div>
              {relative && (
                <div
                  className={cn(
                    "mt-0.5 text-[11px] leading-none text-muted-foreground/50 transition-opacity",
                    "group-hover:opacity-0 sm:group-focus-within:opacity-0",
                  )}
                >
                  {relative}
                </div>
              )}
            </div>
            {barOpen && (
              <div
                className={cn(
                  "shrink-0 transition-opacity",
                  isSelected
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                )}
              >
                <ChatOptionsMenu
                  threadId={item.thread_id}
                  threadTitle={item.thread_title}
                  onExport={onExport}
                  onRename={onRename}
                  onDelete={onDelete}
                  setEditingId={onEditStart}
                  setEditContent={setEditContent}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  },
);

ChatListItem.displayName = "ChatListItem";

interface ChatListItemProps {
  item: { thread_id: string; thread_title?: string; lastUpdated?: number };
  isSelected: boolean;
  onChatClick: (id: string) => void;
  editingId: string | null;
  editContent: string;
  onEditSave: (id: string, title: string) => void;
  onEditCancel: () => void;
  onEditStart: (id: string | null) => void;
  setEditContent: (content: string) => void;
  onExport: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  barOpen: boolean;
}

export default ChatListItem;
