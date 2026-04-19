import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { FileText, Settings, Sliders } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import QUICK_TEMPLATES from "@/lib/utils/QuickPromptTemplates";
import { cn } from "@/lib/utils";

type TabId = "preferences" | "prompt" | "model";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: "preferences", label: "Preferences", icon: <Sliders size={16} /> },
  { id: "prompt", label: "Prompt", icon: <FileText size={16} /> },
  { id: "model", label: "Model", icon: <Settings size={16} /> },
];

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function PreferencesTab() {
  const { localConfig, setLocalConfig, DEFAULT_LOCAL_SETTINGS } = useSettings();

  const options = [
    {
      id: "followUp" as const,
      label: "Suggest follow-up questions",
      description: "Show quick suggestions after each assistant reply.",
      checked: localConfig.followUp ?? DEFAULT_LOCAL_SETTINGS.follow_up,
    },
    {
      id: "showErrorMessages" as const,
      label: "Show error messages",
      description: "Display raw error details when a request fails.",
      checked:
        localConfig.showErrorMessages ??
        DEFAULT_LOCAL_SETTINGS.show_error_messages,
    },
    {
      id: "appearance" as const,
      label: "Dark mode",
      description: "Switch between light and dark themes.",
      checked: localConfig.appearance === "dark",
    },
  ];

  return (
    <div>
      <SectionHeading
        title="Preferences"
        description="Tune the chat experience."
      />
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <div
            key={opt.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-background/40 p-3"
          >
            <div className="min-w-0">
              <Label
                htmlFor={opt.id}
                className="text-sm font-medium text-foreground"
              >
                {opt.label}
              </Label>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {opt.description}
              </p>
            </div>
            <Switch
              id={opt.id}
              checked={opt.checked}
              onCheckedChange={(checked) => {
                if (opt.id === "appearance") {
                  setLocalConfig({ appearance: checked ? "dark" : "light" });
                } else {
                  setLocalConfig({ [opt.id]: checked });
                }
              }}
              className="cursor-pointer data-[state=checked]:bg-brand data-[state=unchecked]:bg-muted-foreground/30"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PromptTab() {
  const { customPrompt, setCustomPrompt, handleSaveCustomPrompt } =
    useSettings();

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading
        title="Custom prompt"
        description="Prepended to every conversation as a system instruction."
      />

      <textarea
        id="custom-prompt-textarea"
        value={customPrompt}
        onChange={(e) => setCustomPrompt(e.target.value)}
        className="h-48 w-full resize-none rounded-lg border border-border/60 bg-background/40 p-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40"
        placeholder="e.g. Answer concisely. Prefer bullet points when listing items..."
      />

      <button
        onClick={handleSaveCustomPrompt}
        className="cursor-pointer rounded-md bg-brand py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
      >
        Save prompt
      </button>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Quick templates
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TEMPLATES.map((template) => (
            <button
              key={template.label}
              onClick={() => setCustomPrompt(template.prompt)}
              className="cursor-pointer rounded-md border border-border/60 bg-background/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted-foreground/5 hover:text-foreground"
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const EMPTY_V_LABELS: string[] = [];

function SliderControl({
  label,
  value,
  onValueChange,
  min,
  max,
  step = 0.01,
  valueLabels = EMPTY_V_LABELS,
}: {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  valueLabels?: string[];
}) {
  const id = label.replace(/\s+/g, "-").toLowerCase();
  const midLabel =
    valueLabels.length === 3 ? valueLabels[1] : (min + max) / 2;
  const lowLabel = valueLabels.length === 3 ? valueLabels[0] : min;
  const highLabel = valueLabels.length === 3 ? valueLabels[2] : max;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <span className="font-mono text-xs text-muted-foreground">{value}</span>
      </div>
      <Slider
        id={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(val) => onValueChange(val[0])}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground/60">
        <span>{lowLabel}</span>
        <span>{midLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function ModelTab() {
  const {
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    topP,
    setTopP,
    presencePenalty,
    setPresencePenalty,
    frequencyPenalty,
    setFrequencyPenalty,
    stopSequences,
    setStopSequences,
    context,
    setContext,
    handleSaveAIConfig,
  } = useSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeading
          title="Sampling"
          description="How the model picks the next token."
        />
        <div className="flex flex-col gap-4">
          <SliderControl
            label="Temperature"
            value={temperature}
            onValueChange={setTemperature}
            min={0}
            max={1}
            valueLabels={["0", "0.5", "1"]}
          />
          <SliderControl
            label="Max tokens"
            value={maxTokens}
            onValueChange={setMaxTokens}
            min={1}
            max={4000}
            step={1}
            valueLabels={["1", "2000", "4000"]}
          />
          <SliderControl
            label="Top P"
            value={topP}
            onValueChange={setTopP}
            min={0}
            max={1}
            valueLabels={["0", "0.5", "1"]}
          />
          <SliderControl
            label="Presence penalty"
            value={presencePenalty}
            onValueChange={setPresencePenalty}
            min={-2}
            max={2}
            valueLabels={["-2", "0", "2"]}
          />
          <SliderControl
            label="Frequency penalty"
            value={frequencyPenalty}
            onValueChange={setFrequencyPenalty}
            min={-2}
            max={2}
            valueLabels={["-2", "0", "2"]}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stop-sequences" className="text-sm font-medium">
              Stop sequences
            </Label>
            <Input
              id="stop-sequences"
              value={stopSequences}
              onChange={(e) => setStopSequences(e.target.value)}
              placeholder="e.g. \n, END, STOP"
            />
            <p className="text-xs text-muted-foreground/70">
              Comma separated. Generation halts when any is produced.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 pt-5">
        <SectionHeading
          title="Context window"
          description="How past messages are packed into each request."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="absolute-max-tokens" className="text-sm font-medium">
              Absolute max tokens
            </Label>
            <Input
              id="absolute-max-tokens"
              type="number"
              min={1}
              max={10000}
              value={context?.absoluteMaxTokens ?? 4000}
              onChange={(e) => {
                const val = Math.min(
                  Math.max(Number(e.target.value), 1),
                  10000,
                );
                setContext({ ...context, absoluteMaxTokens: val });
              }}
            />
            <p className="text-xs text-muted-foreground/70">Up to 10,000.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prev-chat-limit" className="text-sm font-medium">
              Min previous messages
            </Label>
            <Input
              id="prev-chat-limit"
              type="number"
              min={1}
              max={30}
              value={context?.prevChatLimit ?? 6}
              onChange={(e) => {
                const val = Math.min(Math.max(Number(e.target.value), 1), 30);
                setContext({ ...context, prevChatLimit: val });
              }}
            />
            <p className="text-xs text-muted-foreground/70">Range 1–30.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="max-context-tokens" className="text-sm font-medium">
              Max context tokens
            </Label>
            <Input
              id="max-context-tokens"
              type="number"
              min={1}
              max={10000}
              value={context?.maxContextTokens ?? 3000}
              onChange={(e) => {
                const val = Math.min(
                  Math.max(Number(e.target.value), 1),
                  10000,
                );
                setContext({ ...context, maxContextTokens: val });
              }}
            />
            <p className="text-xs text-muted-foreground/70">Up to 10,000.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="truncate-from" className="text-sm font-medium">
              Truncate from
            </Label>
            <div className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2">
              <span className="text-sm">
                {context?.truncateFrom === "end" ? "End" : "Start"}
              </span>
              <Switch
                id="truncate-from"
                checked={context?.truncateFrom === "end"}
                onCheckedChange={() => {
                  setContext({
                    ...context,
                    truncateFrom:
                      context?.truncateFrom === "end" ? "start" : "end",
                  });
                }}
                className="cursor-pointer data-[state=checked]:bg-brand data-[state=unchecked]:bg-muted-foreground/30"
              />
            </div>
            <p className="text-xs text-muted-foreground/70">
              Where to trim when context exceeds the limit.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSaveAIConfig}
        className="cursor-pointer self-start rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
      >
        Save configuration
      </button>
    </div>
  );
}

function TabButton({
  tab,
  isActive,
  onClick,
}: {
  tab: TabDef;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        "flex-1 justify-center sm:flex-initial sm:justify-start",
        isActive
          ? "bg-muted-foreground/10 text-foreground"
          : "text-foreground/70 hover:bg-muted-foreground/5 hover:text-foreground",
      )}
    >
      <span className="shrink-0">{tab.icon}</span>
      <span className="hidden sm:inline">{tab.label}</span>
    </button>
  );
}

const TAB_COMPONENTS: Record<TabId, React.ComponentType> = {
  preferences: PreferencesTab,
  prompt: PromptTab,
  model: ModelTab,
};

function isTabId(value: string): value is TabId {
  return value === "preferences" || value === "prompt" || value === "model";
}

function SettingPopover({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { activeTab, setActiveTab } = useSettings();
  const currentTab: TabId = isTabId(activeTab) ? activeTab : "preferences";
  const ActiveTab = TAB_COMPONENTS[currentTab];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border/60 bg-muted/90 p-0 backdrop-blur-2xl sm:h-[78vh] sm:flex-row">
        <nav
          role="tablist"
          aria-orientation="vertical"
          className="flex flex-row gap-1 border-b border-border/60 p-3 sm:w-52 sm:flex-col sm:border-b-0 sm:border-r"
        >
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={currentTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </nav>

        <div className="custom-scrollbar flex-1 overflow-auto p-6">
          <DialogHeader className="mb-5">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Settings
            </DialogTitle>
          </DialogHeader>

          <ActiveTab />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SettingPopover;
