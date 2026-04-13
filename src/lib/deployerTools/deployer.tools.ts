import { z } from "zod";
import { tool } from "ai";
import { MARKETS } from "./utils/supportingModel";
import { DEFAULT_MARKETS, GpuMarketSlug } from "./utils/types";
import { validateJobDefinition } from "@nosana/sdk";
import {
  chatJSON,
  checkJobExtendable,
  checkJobStop,
  fail,
} from "./utils/helpers";
import {
  suggest_model_market_prompt,
} from "./prompt/deployer.prompt";
import {
  suggest_model_market_schema,
} from "./utils/schema";
import { ensureDeployer } from "./Deployer";
export { createJob } from "./tool.createJob";

export const stopJob = tool({
  description: "Stops a running Nosana job.",
  inputSchema: z.object({ jobId: z.string(), job_owners_pubKey: z.string() }),
  execute: async ({ jobId, job_owners_pubKey }) => {
    const deployer = ensureDeployer();
    const jobResult = await deployer.getJob(jobId);

    if (!jobResult)
      return fail(
        `❌ Job ${jobId} not found. JOB SHOULD BE EXISTING TO BE STOPPED`,
      );
    const { job } = jobResult;

    console.log(job);
    if (!job)
      return fail(
        `❌ Job ${jobId} not found. JOB SHOULD BE EXISTING TO BE STOPPED`,
      );

    const validation = checkJobStop(job, job_owners_pubKey.toString());
    if (validation) return validation;

    const gpuMarket = Object.keys(MARKETS).find(
      (key) => MARKETS[key as GpuMarketSlug].address === job.market.toString(),
    );

    try {
      return {
        args: { jobId },
        prompt: {
          Action: "stop_Job",
          args: {
            JobId: jobId,
            market: job.market.toString(),
            node: job.node.toString(),
            payer: `${job.payer} (you)`,
          },
        },
        // tool_execute: true,
        content: [
          {
            type: "text",
            text: `
🛑 **Job Stop Trigger Sent**

Tell the user:
- The stop request was sent successfully.
- The job will be stopped on when user request it to.

**Display Format:**
| Field | Value |
|-------|--------|
| Job ID | ${jobId} |
| Payer | ${job.payer} |
| market_Address | ${job.market} |
| market_Name | ${gpuMarket} |
| price | ${job.price} |
| state | ${job.state} |
| timeout | ${job.timeout} |
| node | ${job.node} |
| Status | Waiting for user Confirmation to Stop |
| Tool | StopJon |
            `,
          },
        ],
      };
    } catch (err: any) {
      console.error("stopJob error:", err);
      return fail(`❌ Failed to stop job: ${err.message}`);
    }
  },
});

export const extendJobRuntime = tool({
  description: "Extends the runtime of an existing Nosana job.",
  inputSchema: z.object({
    jobId: z.string(),
    extensionSeconds: z
      .number()
      .max(86400)
      .min(60)
      .describe("Maximum extension time is 24 hours."),
    job_owners_pubKey: z.string(),
  }),
  execute: async ({ jobId, extensionSeconds, job_owners_pubKey }) => {
    const deployer = ensureDeployer();
    const jobResult = await deployer.getJob(jobId);

    if (!jobResult) return fail(`⚠️ Job ${jobId} not found.`);
    const { job } = jobResult;

    if (!job) {
      return fail(`⚠️ Job ${jobId} not found.`);
    }

    const validation = checkJobExtendable(
      job,
      job_owners_pubKey,
      extensionSeconds,
    );
    if (validation) return validation;

    try {
      return {
        tool_execute: true,
        args: { jobId, extensionSeconds, job_owners_pubKey },
        prompt: {
          Action: "Extend_Job_Runtime",
          args: {
            JobId: jobId,
            market: job.market.toString(),
            node: job.node.toString(),
            seconds: `${extensionSeconds} sec`,
            hours: `${extensionSeconds / 3600} hr`,
            minutes: `${extensionSeconds / 60} min`,
          },
        },

        content: [
          {
            type: "text",
            text: `
⏱️ Job runtime extension prepared.

Job ID: ${jobId}
Extension (seconds): ${extensionSeconds}
State: pending user approval.
            `,
          },
        ],
      };
    } catch (err: any) {
      console.error("extendJobRuntime error:", err);
      return {
        args: { jobId, extensionSeconds },
        content: [
          {
            type: "text",
            text: `❌ Failed to extend job: ${err.message}`,
          },
        ],
      };
    }
  },
});

export const getJob = tool({
  description: "Fetches details about a Nosana job, using its id",
  inputSchema: z.object({ jobId: z.string() }),
  execute: async ({ jobId }) => {
    try {
      const deployer = ensureDeployer();
      if (!deployer) throw new Error("Deployer not initialized");

      const jobResult = await deployer.getJob(jobId);

      if (!jobResult || !jobResult.job) {
        return fail(`⚠️ Job ${jobId} not found.`);
      }

      const { job, NOS_USD } = jobResult;
      console.log("Job details:", job);

      const marketEntry = Object.entries(MARKETS).find(
        ([, m]) => m.address === job.market.toString(),
      );
      const marketName = marketEntry ? marketEntry[0] : "unknown";

      const timeoutSec = job.timeout;
      const timeoutMin = (timeoutSec / 60).toFixed(2);
      const timeoutHrs = (timeoutSec / 3600).toFixed(2);

      const bn = job.price ? Number(job.price.toString()) : 0;
      const usd = (bn / 100) * (NOS_USD || 0);

      return {
        content: [
          {
            type: "text",
            text: `
📄 **Job Information**
for job id ${jobId}
jobId - ${jobId}
market - ${marketName.toUpperCase()}
gpu address - ${job.market.toString()}
payer - ${job.payer.toString()}
state - ${job.state}
price - ${usd}
timeout - ${timeoutSec}s (${timeoutMin} min / ${timeoutHrs} hr)
project - ${job.project.toString()}
node - ${job.node}
ipfsJob - ${job.ipfsJob}
ipfsResult - ${job.ipfsResult}
`,
          },
        ],
      };
    } catch (err: any) {
      console.error("getJob error:", err);
      return fail(`❌ Failed to fetch job: ${err.message}`);
    }
  },
});

export const getAllJobs = tool({
  description: "Lists all Nosana jobs created by a given user public key.",
  inputSchema: z.object({
    userPubKey: z.string().describe("User's Solana wallet address"),
    state: z
      .enum(["QUEUED", "RUNNING", "COMPLETED", "STOPPED", "ALL"])
      .optional()
      .default("ALL")
      .describe(
        "don't ask user until user from his side dont mention keep all as default",
      ),
  }),

  execute: async ({ userPubKey, state }) => {
    try {
      const deployer = ensureDeployer();
      const jobs = await deployer.getAllJobs(userPubKey, {
        limit: 50,
        state: state ?? "ALL",
      });

      if (!jobs.jobs.length) return fail(`⚠️ No jobs found for ${userPubKey}`);

      const fmt = (t?: number | null) => {
        if (!t || t <= 0) return "";
        const date = new Date(t * 1000);
        return date.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });
      };

      const jobLines = jobs.jobs
        .map((j) => {
          const marketName =
            Object.keys(MARKETS).find(
              (m) => MARKETS[m as GpuMarketSlug].address === j.market,
            ) || "Unknown";

          return `
          ──────────────────────────────
          🧱 **Job ID:** ${j.address}
          🏷️ **Market:** ${marketName} | ${j.market}
          📊 **Status:** ${j.jobStatus}
          💸 **Price:** ${j.price} tokens
          ⌛ **Timeout:** ${j.timeout} sec
          🕒 **Start:** ${fmt(j.timeStart)}
          ⏰ **End:** ${fmt(j.timeEnd)}
          📦 **Payer:** ${j.payer}
          📡 **Address:** ${j.address}
          ──────────────────────────────
          `;
        })
        .join("");

      return {
        content: [
          {
            type: "text",
            text: `📊 Jobs for ${userPubKey}
              ──────────────────────────────
              ${jobLines.trim()}
              💡 Commands you can use next:
              • getJob [jobId] → get detailed info
              • extendJob [jobId] → increase runtime
              • stopJob [jobId] → cancel job early
              • createJob → start a new one`,
          },
        ],
      };
    } catch (err: any) {
      console.error("getAllJobs error:", err);
      return fail(`❌ Failed to list jobs: ${err.message}`);
    }
  },
});

export const getWalletBalance = tool({
  description:
    "Fetches Solana + NOS token balances for the connected Nosana account. additinally give you : current solana and nosana usd price",
  inputSchema: z.object({ UsersPublicKey: z.string() }),
  execute: async ({ UsersPublicKey }) => {
    try {
      const deployer = ensureDeployer();

      // Fetch all data in parallel for better performance
      const [balance, solUsd, nosUsd] = await Promise.all([
        deployer.getWalletBalance(UsersPublicKey),
        deployer.get_sol_Usd(),
        deployer.get_nos_Usd(),
      ]);

      const solValue = balance.sol * solUsd;
      const nosValue = balance.nos * nosUsd;
      const totalValue = solValue + nosValue;

      return {
        content: [
          {
            type: "text",
            text: `
            💰 User Wallet Balances
            ────────────────────────────
            SOLANA : ${balance.sol.toFixed(8)} SOL | $${solValue.toFixed(2)}

            NOSANA : ${balance.nos.toFixed(6)} NOS | $${nosValue.toFixed(2)}
            ────────────────────────────
            Total Value (USD): $${totalValue.toFixed(2)}
            ────────────────────────────
            Would you like to check your jobs or create a new one?
                `,
          },
        ],
      };
    } catch (err: any) {
      console.error("getWalletBalance error:", err);
      return fail(`❌ Failed to fetch wallet: ${err.message}`);
    }
  },
});

export const estimateJobCost = tool({
  description: "Estimates the credit cost of a job on a given GPU market.",
  inputSchema: z.object({
    gpuMarket: z.enum(DEFAULT_MARKETS),
    durationSeconds: z.number(),
  }),
  execute: async ({ gpuMarket, durationSeconds }) => {
    try {
      const deployer = ensureDeployer();
      const gpuMarketPubKey = MARKETS[gpuMarket as GpuMarketSlug].address;
      const cost = await deployer.getExactValue(
        gpuMarketPubKey,
        durationSeconds,
      );

      function formatCost(cost: any, mode = "unique") {
        const { market, hours, NOS, USD, NOS_USD, SOL, NETWORK } = cost;

        switch (mode) {
          case "custom":
            return `Running a job on **${market}** for ${hours.toFixed(2)} hours will cost around **${NOS} NOS** (~$${USD.toFixed(
              2,
            )} USD at ${NOS_USD.toFixed(3)} USD/NOS).`;

          case "system":
            return JSON.stringify(cost, null, 2);

          case "unique":
            return `
            GPU Market : ${market}
            Duration   : ${hours.toFixed(2)} hours (${durationSeconds} seconds)
            Est. Cost  : ${NOS} NOS  (~$${USD.toFixed(2)} USD)
            Gas fee    : ${SOL} (gas fee)
            network fee: ${NETWORK} (network fee)`;

          default:
            return `${market}: ${NOS} NOS (~$${USD.toFixed(2)})`;
        }
      }
      return {
        content: [
          {
            type: "text",
            text: formatCost(cost, "unique"),
          },
        ],
      };
    } catch (err: any) {
      console.error("estimateJobCost error:", err);
      return fail(`❌ Failed to estimate cost: ${err.message}`);
    }
  },
});

export const getMarket = tool({
  description: "Return the latest details of a market/GPU on Nosana.",
  inputSchema: z.object({
    gpuMarket_slug: z
      .enum(DEFAULT_MARKETS)
      .optional()
      .describe("either slug or address one is must both are not optional"),
    gpuMarket_address: z
      .string()
      .optional()
      .describe("either address or slug one is must both are not optional"),
  }),
  execute: async ({ gpuMarket_slug, gpuMarket_address }) => {
    try {
      const deployer = ensureDeployer();
      const { market, nos, gpu_usd, marketName } = await deployer.get_market(
        gpuMarket_slug as GpuMarketSlug,
        gpuMarket_address as string,
      );
      const formatted = Object.entries(market)
        .filter(
          ([k]) =>
            ![
              "jobType",
              "vaultBump",
              "nodeAccessKey",
              "nodeXnosMinimum",
              "queueType",
              "queue",
            ].includes(k),
        )
        .map(([k, v]) => `${k}: ${v}`);

      const nos_per_hour = gpu_usd / nos;
      formatted.push(`usd/hr: ${gpu_usd}`);
      formatted.push(`nos/hr: ${nos_per_hour.toFixed(5)}`);

      return {
        content: [
          {
            type: "text",
            text: `📈 GPU Market Details (${gpuMarket_slug ?? marketName})\n${formatted}

            you decide what to show to user, what might be important to him , 
            you decide how should be format from prompt , like how user want 
            be minimal in prompt response
            - must show addresss , marketName , jobprice other are upto you what to show (unless user dont say)
            - ask follow up tool to user , like if user want to calculate cost to run it for hours ? or something like that
            `,
          },
        ],
      };
    } catch (err: any) {
      console.error("getMarket error:", err);
      return fail(`❌ Failed to fetch market: ${err.message}`);
    }
  },
});

export const listGpuMarkets = tool({
  description:
    "Lists all supported Nosana GPU markets and their metadata. give price | vram | slug | address",
  inputSchema: z.object({}),
  execute: async () => {
    try {
      if (!MARKETS || Object.keys(MARKETS).length === 0)
        return { content: [{ type: "text", text: "No GPU markets found." }] };

      const lines = Object.entries(MARKETS).map(
        ([name, info]) =>
          `• ${name}\n  Address: ${info.address}\n  VRAM: ${info.vram_gb}GB \n  Est. USD/hr: ${info.estimated_price_usd_per_hour}
        
        if you find it too much to show to user then choose the best on from variety | show all if user says to say all markets
        if user ask addional query then use your knowledge you had for these gpu's and add along with?
        how these data to show to user you decide , plain | bullet | table or anything its all upto you
        `,
      );

      return {
        content: [
          {
            type: "text",
            text: `📊 Nosana GPU Markets\n${lines.join("\n\n")}`,
          },
        ],
      };
    } catch (err: any) {
      console.error("listGpuMarkets error:", err);
      return fail(`❌ Failed to list GPU markets: ${err.message}`);
    }
  },
});

export const suggest_model_market = tool({
  description:
    "Suggests the best GPU markets and models based on user requirements.",
  inputSchema: z.object({
    requirements: z.string().describe("user's requirements, separated by '|'"),
  }),
  execute: async ({ requirements }) => {
    try {
      const result = await chatJSON(
        suggest_model_market_prompt(requirements, MARKETS),
        suggest_model_market_schema,
      );

      const formattedMarkets = result.market
        .map(
          (m) =>
            `→ ${m.name} (${m.address}) — ${m.price}/hr\n   Reason: ${m.reason} Score : ${m.recommandation_score}`,
        )
        .join("\n");

      const formattedModels = result.model
        .map(
          (m) =>
            `→ ${m.name}\n   Reason: ${m.reason} Score : ${m.recommandation_score}`,
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `📊 Based on your requirements, here are the optimal model and market options:

# 🖥️ Markets / GPUs
${formattedMarkets}

# 🧠 Models
${formattedModels}`,
          },
        ],
      };
    } catch (err: any) {
      return fail(`Failed to suggest model and market: ${err.message}`);
    }
  },
});

export const getModels_from_tags = tool({
  description:
    "give hugging face model list from tags, you just use it for for him, used when same name models are giving error",
  inputSchema: z.object({
    modelProvider: z
      .string()
      .describe(
        "organization name ex deepseek-ai , mistralai , qwen , qwen2 , qwen1.5 , google etc.",
      ),
    tags: z.array(z.string()).describe(`
    Examples:
      • prompt : deepseek coder model with 7B parameters, instruct tuned
        tags   : ['deepseek', 'coder', '7B', 'instruct']

      • prompt : qwen model with 20B+ parameters
        tags   : ['qwen','32B', '72B']

      • prompt : mistral large instruct model
        tags   : ['mistral', '24B', '123B', 'instruct']

      • prompt : llama 3 instruct model
        tags   : ['llama', '8B', 'instruct']
    `),
    pipeline: z
      .enum(["image-text-to-text", "text-generation"])
      .describe("the pipeline name"),
  }),
  execute: async ({ tags, modelProvider, pipeline }) => {
    const deployer = ensureDeployer();
    const models = await deployer.getModels({
      pipeline: pipeline,
      keywords: tags,
      organization: modelProvider,
    });

    const prompt = models.map((m) => `- ${m.id}`).join("\n");
    try {
      return {
        content: [
          {
            type: "text",
            text: `
            ${prompt}
            `,
          },
        ],
      };
    } catch (err: any) {
      return fail(`Failed to get models: ${err.message}`);
    }
  },
});

export const validate_job_definition = tool({
  description:
    "Validates and debugs a Nosana job definition JSON. Use this when user provides a complete JSON config or wants to check their config for errors. Does NOT execute the job, only validates syntax and structure.",
  inputSchema: z.object({
    jobDefinition: z
      .record(z.string(), z.any())
      .describe("The complete job definition JSON object to validate"),
    strict: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        "If true, performs strict validation. If false, only checks critical fields.",
      ),
  }),
  execute: async ({ jobDefinition }) => {
    try {
      // Validate using Nosana SDK
      const validation = validateJobDefinition(jobDefinition);

      if (!validation.success) {
        const errors =
          validation.errors
            ?.map((e: any) => `  • ${e.path.join(".")}: ${e.message}`)
            .join("\n") || "Unknown validation errors";

        return {
          content: [
            {
              type: "text",
              text: `
❌ **Job Definition Validation Failed**

**Errors Found:**
${errors}

**Provided JSON:**
\`\`\`json
${JSON.stringify(jobDefinition, null, 2)}
\`\`\`

**Suggestions:**
- Check that all required fields are present: type, version, ops, meta
- Ensure 'ops' is an array with at least one operation
- Verify 'image' field contains a valid container image
- Check that 'env' is an object with string key-value pairs
- Ensure 'expose' is a valid port number (1-65535)

Would you like me to help fix these issues?
`,
            },
          ],
        };
      }

      // Additional checks
      const issues: string[] = [];
      const warnings: string[] = [];

      // Check for common issues
      if (jobDefinition.ops?.[0]?.args?.image) {
        const image = jobDefinition.ops[0].args.image;
        if (!image.includes("/") && !image.includes(":")) {
          warnings.push(
            "Image name might be incomplete. Expected format: org/repo:tag or registry/org/repo:tag",
          );
        }
      }

      if (jobDefinition.ops?.[0]?.args?.env) {
        const env = jobDefinition.ops[0].args.env;
        const requiredEnvForTextGen = ["MODEL_ID", "MAX_MODEL_LEN"];
        const hasTextGenKeys = requiredEnvForTextGen.some((key) => key in env);

        if (
          jobDefinition.ops[0].args.image?.includes(
            "text-generation-inference",
          ) &&
          !hasTextGenKeys
        ) {
          warnings.push(
            "Text generation image detected but missing common env vars like MODEL_ID or MAX_MODEL_LEN",
          );
        }
      }

      const vram =
        jobDefinition.ops?.[0]?.args?.required_vram ||
        jobDefinition.meta?.system_requirements?.required_vram;
      if (!vram) {
        warnings.push(
          "No VRAM requirement specified. Consider adding required_vram field.",
        );
      }

      if (!jobDefinition.ops?.[0]?.args?.expose) {
        warnings.push(
          "No port exposed. Service might not be accessible externally.",
        );
      }

      // Check for HF token in gated models
      if (jobDefinition.ops?.[0]?.args?.env?.MODEL_ID) {
        const modelId = jobDefinition.ops[0].args.env.MODEL_ID;
        if (
          !jobDefinition.ops[0].args.env?.HF_TOKEN &&
          !jobDefinition.ops[0].args.env?.HUGGING_FACE_HUB_TOKEN
        ) {
          warnings.push(
            `Model ${modelId} might be gated or private. Consider adding HF_TOKEN if needed.`,
          );
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `
✅ **Job Definition is Valid!**

${warnings.length > 0
                ? `
⚠️ **Warnings (non-critical):**
${warnings.map((w) => `  • ${w}`).join("\n")}
`
                : ""
              }

**Validated JSON:**
\`\`\`json
${JSON.stringify(jobDefinition, null, 2)}
\`\`\`

**Summary:**
- Type: ${jobDefinition.type}
- Operations: ${jobDefinition.ops?.length || 0}
- Image: ${jobDefinition.ops?.[0]?.args?.image || "Not specified"}
- Exposed Port: ${jobDefinition.ops?.[0]?.args?.expose || "None"}
- GPU Required: ${jobDefinition.ops?.[0]?.args?.gpu ? "Yes" : "No"}
- VRAM: ${vram || "Not specified"} GB

**Next Steps:**
1. Copy this JSON to Nosana Dashboard: https://dashboard.nosana.com/deploy
2. Or use createJob tool to deploy it with your wallet

${issues.length > 0
                ? `
**Critical Issues to Fix:**
${issues.map((i) => `  • ${i}`).join("\n")}
`
                : ""
              }
`,
          },
        ],
      };
    } catch (err: any) {
      return {
        content: [
          {
            type: "text",
            text: `
❌ **Validation Error**

${err.message || "Unknown error during validation"}

**Provided JSON:**
\`\`\`json
${JSON.stringify(jobDefinition, null, 2)}
\`\`\`

**Common Issues:**
- Missing required fields (type, version, ops, meta)
- Invalid JSON structure
- Incorrect data types for fields

Would you like me to help you create a proper job definition from scratch?
`,
          },
        ],
      };
    }
  },
});
