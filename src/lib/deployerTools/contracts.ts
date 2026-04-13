export type CreateJobRuntime = "custom" | "ollama" | "vllm";

export type CreateJobExecutionArgs = {
  marketPubKey: string;
  timeoutSeconds: number;
  userPublicKey?: string;
  runtime: CreateJobRuntime;
  provider: "container";
  modelId?: string;
  testGeneration: boolean;
};

export type CreateJobApproval = {
  version: 1;
  action: "createJob";
  jobDefinition: Record<string, any>;
  execution: CreateJobExecutionArgs;
  display: {
    image: string;
    market?: string;
    marketPubKey: string;
    requiredVram?: number;
    timeoutSeconds: number;
    runtime: CreateJobRuntime;
    modelId?: string;
  };
};

function normalizeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function inferCreateJobRuntime(
  jobDefinition: Record<string, any>,
): CreateJobRuntime {
  const image = normalizeString(jobDefinition?.ops?.[0]?.args?.image) || "";

  if (image.includes("ollama")) return "ollama";
  if (image.includes("vllm")) return "vllm";
  return "custom";
}

export function inferCreateJobModelId(
  jobDefinition: Record<string, any>,
  runtime = inferCreateJobRuntime(jobDefinition),
): string | undefined {
  if (runtime === "ollama") {
    return normalizeString(
      jobDefinition?.global?.variables?.MODEL ||
        jobDefinition?.ops?.[0]?.args?.resources?.[0]?.model,
    );
  }

  if (runtime === "vllm") {
    const cmd = jobDefinition?.ops?.[0]?.args?.cmd;
    if (Array.isArray(cmd)) {
      return normalizeString(cmd[0]);
    }
  }

  return undefined;
}

export function buildCreateJobApproval(args: {
  jobDefinition: Record<string, any>;
  marketPubKey: string;
  timeoutSeconds: number;
  userPublicKey?: string;
  market?: string;
}): CreateJobApproval {
  const runtime = inferCreateJobRuntime(args.jobDefinition);
  const modelId = inferCreateJobModelId(args.jobDefinition, runtime);

  return {
    version: 1,
    action: "createJob",
    jobDefinition: args.jobDefinition,
    execution: {
      marketPubKey: args.marketPubKey,
      timeoutSeconds: args.timeoutSeconds,
      ...(args.userPublicKey ? { userPublicKey: args.userPublicKey } : {}),
      runtime,
      provider: "container",
      ...(modelId ? { modelId } : {}),
      testGeneration: runtime === "ollama" || runtime === "vllm",
    },
    display: {
      image: normalizeString(args.jobDefinition?.ops?.[0]?.args?.image) || "",
      ...(args.market ? { market: args.market } : {}),
      marketPubKey: args.marketPubKey,
      requiredVram: args.jobDefinition?.meta?.system_requirements?.required_vram,
      timeoutSeconds: args.timeoutSeconds,
      runtime,
      ...(modelId ? { modelId } : {}),
    },
  };
}
