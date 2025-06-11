import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const nuggetsEnvSchema = z.object({
  NUGGETS_OIDC_PROVIDER_URL: z.string().optional(),
  NUGGETS_OIDC_CLIENT_ID: z
    .string()
    .min(1, "Nuggets OIDC Application Client ID is required"),
  NUGGETS_OIDC_PRIVATE_KEY: z
    .string()
    .min(1, "Nuggets OIDC Application Client private key is required"),
});

export type nuggetsConfig = z.infer<typeof nuggetsEnvSchema>;

export async function validateNuggetsConfig(
  runtime: IAgentRuntime,
): Promise<nuggetsConfig> {
  try {
    const config = {
      NUGGETS_OIDC_PROVIDER_URL: runtime.getSetting(
        "NUGGETS_OIDC_PROVIDER_URL",
      ),
      NUGGETS_OIDC_CLIENT_ID: runtime.getSetting("NUGGETS_OIDC_CLIENT_ID"),
      NUGGETS_OIDC_PRIVATE_KEY: runtime.getSetting("NUGGETS_OIDC_PRIVATE_KEY"),
    };

    return nuggetsEnvSchema.parse(config);
  } catch (error) {
    console.log("error::::", error);
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(
        `Nuggets configuration validation failed:\n${errorMessages}`,
      );
    }
    throw error;
  }
}
