"use client";

import React, { useEffect, useState, useMemo } from "react";
import { redirect } from "next/navigation";
import { useChatStore } from "@/store/chat.store";
import { useShallow } from "zustand/shallow";
import { useRouter } from "next/navigation";
import { LoginDropDown } from "./SettingDropdown";
import SearchPopup from "./SearchPopup";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/setting.store";
import { TemplatePopUP } from "./TemplatePop";
import SidebarActions from "./sidebar/SidebarActions";
import SidebarHeader from "./sidebar/SidebarHeader";
import ChatListItem from "./sidebar/ChatListItem";

interface SideBarProps {
  onTemplateSelect?: (jobDefinition: Record<string, any>) => void;
}

export default function SideBar({ onTemplateSelect }: SideBarProps) {
  const router = useRouter();
  const {
    loadChatHistory,
    chatHistory,
    deletethread,
    selectedChatId,
    exportThread,
    updateThreadTitle,
  } = useChatStore(
    useShallow((state) => ({
      loadChatHistory: state.loadChatHistory,
      chatHistory: state.chatHistory,
      deletethread: state.deletethread,
      selectedChatId: state.selectedChatId,
      exportThread: state.exportThread,
      updateThreadTitle: state.updateThreadTitle,
    })),
  );

  const {
    mobileOpen,
    toggleMobile,
    toggleTemplate,
    templateOpen,
    sidebarCollapsed,
    setLocalConfig,
  } = useSettingsStore(
    useShallow((state) => ({
      mobileOpen: state.mobileOpen,
      toggleMobile: state.toggleMobile,
      toggleTemplate: state.toggleTemplate,
      templateOpen: state.templateOpen,
      sidebarCollapsed: state.localConfig.sidebarCollapsed,
      setLocalConfig: state.setLocalConfig,
    })),
  );

  const barOpen = !sidebarCollapsed;
  const setBarOpen = (open: boolean) =>
    setLocalConfig({ sidebarCollapsed: !open });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [popupOpen, setPopupOpen] = useState(false);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    loadChatHistory().catch(console.error);
  }, [loadChatHistory]);

  useEffect(() => {
    setHeight(window.innerHeight);
    const handleResize = () => setHeight(window.innerHeight);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const isDesktop = window.innerWidth >= 1024;
      const width = isDesktop ? (barOpen ? "260px" : "60px") : "0px";
      root.style.setProperty("--sidebar-width", width);
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      root.style.setProperty("--sidebar-width", "0px");
    };
  }, [barOpen]);

  const handleOldChat = (id: string) => {
    useChatStore.getState().setSelectedChatId(id);
    const chat = chatHistory.find((c) => c.thread_id === id);
    const toolParam = chat?.tool === "deployer" ? "?tool=deployer" : "";
    router.push(`/ask/${id}${toolParam}`);
    if (mobileOpen) toggleMobile();
  };

  const handleDelete = (id: string) => {
    deletethread(id)
      .then(() => {
        const { selectedChatId, setSelectedChatId } = useChatStore.getState();
        if (selectedChatId === id) {
          setSelectedChatId(null);
          router.push("/ask");
        }
      })
      .catch(console.error);
  };

  const handleExport = (id: string) => {
    exportThread(id).catch(console.error);
  };

  const handleNewChat = () => {
    if (mobileOpen) toggleMobile();
    redirect("/ask");
  };

  const handleEditSave = (id: string, title: string) => {
    updateThreadTitle(id, title);
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const getTimeLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0)) /
        (24 * 60 * 60 * 1000),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return "Last week";
    if (diffDays < 30) return "This month";
    return "Older";
  };

  const groupedChats = useMemo(() => {
    const groups: Record<string, typeof chatHistory> = {};
    [...chatHistory]
      .sort((a, b) => Number(b.thread_id) - Number(a.thread_id))
      .forEach((item) => {
        const label = getTimeLabel(Number(item.thread_id));
        if (!groups[label]) groups[label] = [];
        groups[label].push(item);
      });
    return groups;
  }, [chatHistory]);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => toggleMobile()}
        />
      )}

      <div
        id="sidebar-container"
        className={cn(
          "flex h-full flex-col justify-between border-r border-muted-foreground/10 bg-muted text-muted-foreground",
          "transition-[width,opacity] duration-300 ease-in-out lg:relative",
          mobileOpen
            ? "fixed inset-y-0 left-0 z-50 shadow-2xl"
            : "hidden lg:flex",
          barOpen
            ? "w-[min(86vw,320px)] opacity-100 lg:w-[260px]"
            : "w-[60px] opacity-95",
        )}
        style={{ height: height ? `${height}px` : undefined }}
      >
        <div className="flex flex-col gap-4 px-3 py-4">
          <SidebarHeader
            barOpen={barOpen}
            setBarOpen={setBarOpen}
            toggleMobile={toggleMobile}
          />
          <SidebarActions
            barOpen={barOpen}
            setBarOpen={setBarOpen}
            setPopupOpen={setPopupOpen}
            handleNewChat={handleNewChat}
          />
        </div>

        <div
          hidden={!barOpen}
          className="scrollbar-hide flex-1 overflow-y-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar-thumb]:hidden [&::-webkit-scrollbar-track]:hidden [&::-webkit-scrollbar]:hidden"
        >
          {Object.entries(groupedChats).map(([label, items]) => (
            <div key={label} className="mb-4">
              <div className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
                {label}
              </div>
              {items.map((item) => (
                <ChatListItem
                  key={item.thread_id}
                  item={item}
                  isSelected={selectedChatId === item.thread_id}
                  onChatClick={handleOldChat}
                  editingId={editingId}
                  editContent={editContent}
                  onEditSave={handleEditSave}
                  onEditCancel={handleEditCancel}
                  onEditStart={setEditingId}
                  setEditContent={setEditContent}
                  onExport={handleExport}
                  onRename={updateThreadTitle}
                  onDelete={handleDelete}
                  barOpen={barOpen}
                />
              ))}
            </div>
          ))}
          {chatHistory.length === 0 && barOpen && (
            <div className="px-2 py-4 text-xs text-muted-foreground/50">
              No chats yet. Start a new conversation.
            </div>
          )}
        </div>

        {popupOpen && (
          <SearchPopup setPopupOpen={setPopupOpen} chatHistory={chatHistory} />
        )}
        {templateOpen && onTemplateSelect && (
          <TemplatePopUP
            toggleTemplate={toggleTemplate}
            onSelectTemplate={onTemplateSelect}
          />
        )}

        <div className="p-3">
          <LoginDropDown barOpen={barOpen} router={router} />
        </div>
      </div>
    </>
  );
}
