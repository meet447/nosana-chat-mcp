import { ArrowRightFromLine, Sparkles } from "lucide-react";
import { Button } from "../ui/button";
import { SlMagnifier } from "react-icons/sl";
import { cn } from "@/lib/utils";

interface SidebarActionsProps {
  barOpen: boolean;
  setBarOpen: (open: boolean) => void;
  setPopupOpen: (open: boolean) => void;
  handleNewChat: () => void;
}

const SidebarActions = ({
  barOpen,
  setBarOpen,
  setPopupOpen,
  handleNewChat,
}: SidebarActionsProps) => (
  <div className="space-y-2">
    {!barOpen && (
      <button
        type="button"
        aria-label="Expand sidebar"
        onClick={() => setBarOpen(true)}
        className="flex w-full items-center justify-center rounded-md border border-border/60 bg-transparent py-2 text-foreground/70 transition-colors hover:bg-muted-foreground/5 hover:text-foreground"
      >
        <ArrowRightFromLine className="size-4" />
      </button>
    )}

    <Button
      onClick={async () => {
        setBarOpen(true);
        await new Promise((r) => setTimeout(r, 100));
        setPopupOpen(true);
      }}
      aria-label="Search chats"
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-background/50 p-2 text-foreground/80 transition-colors hover:bg-muted-foreground/5 hover:text-foreground",
        !barOpen && "justify-center",
      )}
    >
      <SlMagnifier className="size-4" />
      {barOpen && (
        <span className="line-clamp-1 flex w-full items-center font-medium">
          Search chats
        </span>
      )}
    </Button>

    <Button
      onClick={handleNewChat}
      aria-label="New chat"
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-transparent p-2 text-foreground/85 transition-colors hover:bg-muted-foreground/5 hover:text-foreground",
        barOpen ? "justify-center" : "justify-center px-2",
      )}
    >
      {barOpen && <span className="font-medium">New chat</span>}
      <Sparkles size={16} />
    </Button>
  </div>
);

export default SidebarActions;
