import type { MODEL_AVAILABLE } from "../types";
import { ModelConfigs } from "../model";
import { SelfModel } from "./self";
import type { SELF_MODEL_AVAILABLE } from "../types";

export function modelSupportsWebSearch(modelName: string): boolean {
  const config = ModelConfigs[modelName as MODEL_AVAILABLE];
  return config ? config.search : false;
}

type ModelMap = {
  self: SELF_MODEL_AVAILABLE;
};

export function getModelInstance<P extends keyof ModelMap>(
  provider: P,
  modelName: ModelMap[P],
  apiKeys?: Record<"openai", string>,
) {
  switch (provider) {
    case "self":
      return SelfModel(modelName);
    default:
      throw new Error("Invalid provider");
  }
}
