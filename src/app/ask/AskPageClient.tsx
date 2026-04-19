/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRightFromLine } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useChatLogic } from "@/hooks/useChatLogic";
import { deployerQuestions, questions } from "@/lib/utils/questions";
import SideBar from "@/components/SideBar";
import { useSettingsStore } from "@/store/setting.store";
import { cn } from "@/lib/utils";
import { DEFAULT } from "@/lib/constants";
import { AskForm } from "@/components/ChatForm/AskForm";
import { useChatStore } from "@/store/chat.store";
import ChatNavBar from "@/components/Chatnavbar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

function AskPage() {
  const [input, setInput] = useState("");
  const { model, setModel, selectedModel, setSelectedModel, mcp } =
    useChatLogic();

  const tool = useChatStore((state) => state.tool);
  const setPendingQuery = useChatStore((state) => state.setPendingQuery);

  const [randomQuestions, setRandomQuestions] = useState<typeof questions>([]);
  const {
    localConfig: { appearance },
    toggleMobile,
  } = useSettingsStore();
  const textref = useRef<HTMLTextAreaElement>(
    null,
  ) as React.RefObject<HTMLTextAreaElement>;
  const router = useRouter();
  const searchParams = useSearchParams();
  const customServiceUrl =
    searchParams.get("custom-service_url") ||
    searchParams.get("custom_service_url") ||
    searchParams.get("service_url");
  const customServiceModel =
    searchParams.get("custom-model") ||
    searchParams.get("custom_model") ||
    searchParams.get("service_model");

  useEffect(() => {
    const modelFromUrl = customServiceModel || searchParams.get("model");
    const saved = localStorage.getItem("llmmodel");
    setModel(modelFromUrl || saved || DEFAULT.MODEL);
    setTimeout(() => textref.current?.focus(), 50);

    const picked = [...questions].sort(() => Math.random() - 0.5).slice(0, 3);
    setRandomQuestions(picked);
  }, [searchParams, customServiceModel, setModel]);

  const buildStartChatUrl = useCallback(
    (chatId: number, modelToSend: string) => {
      const params = new URLSearchParams();
      params.set("model", modelToSend);
      params.set("chatid", String(chatId));
      if (mcp) params.set("tool", "deployer");
      if (customServiceUrl) params.set("custom-service_url", customServiceUrl);
      if (customServiceModel) params.set("custom-model", customServiceModel);
      return `/ask/${chatId}?${params.toString()}`;
    },
    [mcp, customServiceUrl, customServiceModel],
  );

  const handleStartChat = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      const chatId = Date.now();
      const modelToSend = model || DEFAULT.MODEL;

      setPendingQuery(input);

      router.push(buildStartChatUrl(chatId, modelToSend));
    },
    [input, model, setPendingQuery, router, buildStartChatUrl],
  );

  const handleTemplateSelect = useCallback(
    (jobDefinition: Record<string, any>) => {
      const jsonString = JSON.stringify(jobDefinition, null, 2);
      setInput(jsonString);

      // Auto-submit after setting the input
      setTimeout(() => {
        const chatId = Date.now();
        const modelToSend = model || DEFAULT.MODEL;

        setPendingQuery(jsonString);

        router.push(buildStartChatUrl(chatId, modelToSend));
      }, 100);
    },
    [model, setPendingQuery, router, buildStartChatUrl],
  );

  const formProps = useMemo(
    () => ({
      input,
      setInput,
      model,
      setModel,
      selectedModel: selectedModel || model,
      setSelectedModel,
      onSubmit: handleStartChat,
      textareaRef: textref,
      mcp,
    }),
    [input, model, selectedModel, mcp],
  );

  const displayedQuestions = mcp ? deployerQuestions : randomQuestions;

  return (
    <>
      <div className={appearance}>
        <SideBar onTemplateSelect={handleTemplateSelect} />
      </div>

      {!mcp && (
        <button
          onClick={() => toggleMobile()}
          type="button"
          className="fixed left-3 z-40 rounded-full border border-border/60 bg-background/90 p-2 shadow-md backdrop-blur lg:hidden"
          style={{ top: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <ArrowRightFromLine
            className={cn("cursor-pointer lg:hidden text-muted-foreground")}
          />
        </button>
      )}

      <div
        className={cn(
          "w-full flex-col flex min-h-screen transition-colors duration-500",
          appearance,
          "bg-background text-foreground",
        )}
      >
        {mcp && (
          <div className="sticky top-0 z-40 w-full">
            <ChatNavBar onTemplateSelect={handleTemplateSelect} />
          </div>
        )}

        <div
          className={cn(
            "flex flex-1 flex-col items-center justify-center px-4 pb-32 pt-16 sm:px-6 md:pb-20",
            mcp && "pt-0",
          )}
        >
          <div className="flex w-full flex-col items-center md:-translate-y-6">
            <div className="mb-8 text-center">
              {mcp ? (
                <div className="flex flex-col items-center gap-2">
                  <h1 className="text-3xl font-extralight text-foreground sm:text-4xl">
                    <span className="font-bold text-brand">NOSANA</span>
                    <span className="mx-2 text-muted-foreground/40">·</span>
                    <span className="text-muted-foreground">Deployer</span>
                  </h1>
                  <p className="max-w-md text-sm text-muted-foreground/80">
                    Deploy and manage models on the Nosana network through
                    natural language.
                  </p>
                </div>
              ) : (
                <h1 className="text-2xl font-extralight text-foreground sm:text-3xl">
                  <span className="font-bold">Hey</span>, how may I assist you
                  today?
                </h1>
              )}
            </div>

            <AskForm {...formProps} className="mt-4 hidden md:flex" />

            <div className="mt-8 grid w-full max-w-[800px] grid-cols-1 gap-3 sm:w-[80vw] sm:grid-cols-2 md:w-[70vw] lg:w-[60vw] lg:grid-cols-3 xl:w-[50vw]">
              {displayedQuestions.map((q) => (
                <button
                  type="button"
                  key={q.id}
                  onClick={() => {
                    setInput(q.text);
                    textref.current?.focus();
                  }}
                  className={cn(
                    "group flex min-h-[7.5rem] select-none flex-col items-start gap-3 rounded-xl border border-border/60 bg-muted/40 p-4 text-left shadow-sm transition-all duration-200",
                    "hover:-translate-y-0.5 hover:border-brand/40 hover:bg-muted/70 hover:shadow-md",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-brand/15 [&>svg]:h-[22px] [&>svg]:w-[22px]">
                    {q.Icon}
                  </div>
                  <div className="w-full">
                    <div className="text-sm font-medium text-foreground">
                      {q.topic}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {q.text}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 px-2 pt-2 backdrop-blur-sm transition-colors duration-500 md:hidden",
          )}
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex justify-center">
            <AskForm {...formProps} />
          </div>
        </div>

        <Footer className="absolute bottom-0 self-center" />
      </div>
    </>
  );
}

export default function AskPageClient() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AskPage />
    </Suspense>
  );
}
