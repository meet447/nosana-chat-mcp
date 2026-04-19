import { AsyncLocalStorage } from "node:async_hooks";
import type { Network } from "./types";

export type DeployerAuthMode = "wallet" | "api_key" | "none";

type PlannerContext = {
  model?: string;
  authMode?: DeployerAuthMode;
  network?: Network;
};

const storage = new AsyncLocalStorage<PlannerContext>();

// Fallback for when AsyncLocalStorage context is lost (e.g. inside AI SDK tool executes)
let _globalContext: PlannerContext = {};

function getDefaultNetwork(): Network {
  return process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet"
    ? "mainnet"
    : "devnet";
}

export function runWithPlannerModel<T>(
  model: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  return runWithDeployerContext({ model }, fn);
}

export function getPlannerModel(): string | undefined {
  return storage.getStore()?.model ?? _globalContext.model;
}

export function runWithDeployerContext<T>(
  context: PlannerContext,
  fn: () => Promise<T>,
): Promise<T> {
  _globalContext = {
    ..._globalContext,
    ...context,
    network: context.network ?? _globalContext.network ?? getDefaultNetwork(),
  };

  return storage.run(_globalContext, fn);
}

export function getDeployerNetwork(): Network {
  return storage.getStore()?.network ?? _globalContext.network ?? getDefaultNetwork();
}

export function getDeployerAuthMode(): DeployerAuthMode | undefined {
  return storage.getStore()?.authMode ?? _globalContext.authMode;
}
