import { useState, useEffect, useCallback } from "react";
import { useSettingsStore } from "@/store/setting.store";
import {
  AIConfig,
  AIContext,
  DEFAULT_AI_CONFIG,
  DEFAULT_LOCAL_SETTINGS,
} from "@/lib/constants";

export function useSettings() {
  const { activeTab, setActiveTab, localConfig, setLocalConfig } =
    useSettingsStore();

  const [customPrompt, setCustomPrompt] = useState("");
  const [aiConfig, setAiConfig] = useState<AIConfig>(() => ({
    temperature: DEFAULT_AI_CONFIG.temperature,
    max_tokens: DEFAULT_AI_CONFIG.max_tokens,
    top_p: DEFAULT_AI_CONFIG.top_p,
    presence_penalty: DEFAULT_AI_CONFIG.presence_penalty,
    frequency_penalty: DEFAULT_AI_CONFIG.frequency_penalty,
    stop: DEFAULT_AI_CONFIG.stop,
    context: { ...DEFAULT_AI_CONFIG.context },
  }));
  const [stopSequences, setStopSequences] = useState(() =>
    DEFAULT_AI_CONFIG.stop.join(", "),
  );

  useEffect(() => {
    const savedPrompt = localStorage.getItem("customPrompt");
    if (savedPrompt) setCustomPrompt(savedPrompt);

    const savedConfig = localStorage.getItem("customAIConfig");
    if (savedConfig) {
      try {
        const parsed: AIConfig = JSON.parse(savedConfig);
        setAiConfig(parsed);
        setStopSequences(parsed.stop.join(", "));
      } catch {
        // ignore corrupt payload
      }
    } else {
      localStorage.setItem(
        "customAIConfig",
        JSON.stringify(DEFAULT_AI_CONFIG),
      );
    }

    if (!localStorage.getItem("customPrompt")) {
      localStorage.setItem("customPrompt", "");
    }
  }, []);

  const handleSaveAIConfig = useCallback(() => {
    const config: AIConfig = {
      ...aiConfig,
      stop: stopSequences
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
    };
    localStorage.setItem("customAIConfig", JSON.stringify(config));
    setAiConfig(config);
  }, [aiConfig, stopSequences]);

  const handleSaveCustomPrompt = useCallback(() => {
    localStorage.setItem("customPrompt", customPrompt);
  }, [customPrompt]);

  return {
    activeTab,
    setActiveTab,
    customPrompt,
    setCustomPrompt,
    context: aiConfig.context,
    setContext: (c: AIContext) =>
      setAiConfig((prev) => ({ ...prev, context: c })),
    temperature: aiConfig.temperature,
    setTemperature: (t: number) =>
      setAiConfig((prev) => ({ ...prev, temperature: t })),
    maxTokens: aiConfig.max_tokens,
    setMaxTokens: (m: number) =>
      setAiConfig((prev) => ({ ...prev, max_tokens: m })),
    topP: aiConfig.top_p,
    setTopP: (p: number) => setAiConfig((prev) => ({ ...prev, top_p: p })),
    presencePenalty: aiConfig.presence_penalty,
    setPresencePenalty: (p: number) =>
      setAiConfig((prev) => ({ ...prev, presence_penalty: p })),
    frequencyPenalty: aiConfig.frequency_penalty,
    setFrequencyPenalty: (f: number) =>
      setAiConfig((prev) => ({ ...prev, frequency_penalty: f })),
    stopSequences,
    setStopSequences,
    localConfig,
    setLocalConfig,
    handleSaveAIConfig,
    handleSaveCustomPrompt,
    DEFAULT_LOCAL_SETTINGS,
  };
}
