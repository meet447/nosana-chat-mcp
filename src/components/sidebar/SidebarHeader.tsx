"use client";

import { cn } from "@/lib/utils";
import { ArrowLeftToLine, MessageSquare, Rocket } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useChatStore } from "@/store/chat.store";

interface SidebarHeaderProps {
  barOpen: boolean;
  setBarOpen: (open: boolean) => void;
  toggleMobile: () => void;
}

const SidebarHeader = ({
  barOpen,
  setBarOpen,
  toggleMobile,
}: SidebarHeaderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const tool = useChatStore((s) => s.tool);
  const isDeployer = tool === "deployer";
  const onAskRoot = pathname === "/ask";

  const goChat = () => {
    if (onAskRoot && !isDeployer) return;
    router.push("/ask");
  };
  const goDeployer = () => {
    if (onAskRoot && isDeployer) return;
    router.push("/ask?tool=deployer");
  };

  const handleCollapseClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      toggleMobile();
    } else {
      setBarOpen(!barOpen);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-dashed border-muted-foreground/20 pb-3 text-sm font-semibold text-foreground",
      )}
    >
      {barOpen ? (
        <div className="flex w-full items-center gap-2 text-foreground">
          <Link href="/ask" className="flex flex-1 items-center gap-2">
            <Image
              src="/nosana.png"
              alt="Nosana"
              width={24}
              height={24}
              className="h-6 w-6 cursor-pointer"
            />
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-brand">NOSANA</span>
              <span className="text-foreground">Chat</span>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleCollapseClick}
            aria-label="Collapse sidebar"
            className="rounded p-1 transition-colors hover:bg-muted-foreground/10"
          >
            <ArrowLeftToLine className="size-4 text-muted-foreground/80" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Link href="/ask" aria-label="Nosana home">
            <Image
              src="/nosana.png"
              alt="Nosana"
              width={28}
              height={28}
              className="h-7 w-7 cursor-pointer"
            />
          </Link>
        </div>
      )}

      {barOpen ? (
        <div
          role="tablist"
          aria-label="Mode"
          className="flex w-full gap-0.5 rounded-lg border border-border/60 bg-background/60 p-0.5"
        >
          <button
            role="tab"
            aria-selected={!isDeployer}
            onClick={goChat}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              !isDeployer
                ? "bg-brand text-brand-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MessageSquare size={13} />
            Chat
          </button>
          <button
            role="tab"
            aria-selected={isDeployer}
            onClick={goDeployer}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              isDeployer
                ? "bg-brand text-brand-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Rocket size={13} />
            Deployer
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={goChat}
            aria-label="Chat mode"
            title="Chat"
            className={cn(
              "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors",
              !isDeployer
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground/70 hover:bg-muted-foreground/10 hover:text-foreground",
            )}
          >
            <MessageSquare size={15} />
          </button>
          <button
            type="button"
            onClick={goDeployer}
            aria-label="Deployer mode"
            title="Deployer"
            className={cn(
              "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors",
              isDeployer
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground/70 hover:bg-muted-foreground/10 hover:text-foreground",
            )}
          >
            <Rocket size={15} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SidebarHeader;
