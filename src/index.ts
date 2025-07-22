import type { Plugin } from '@elizaos/core';
import {
  type IAgentRuntime,
  type Memory,
  type Provider,
  type ProviderResult,
  type State,
  logger,
} from '@elizaos/core';
import { z } from 'zod';
import { validateNuggetsConfig } from "./environment";
import routeOidcCallback from "./routes/oidc/callback";
import ServiceNuggets from "./services/nuggets";
import ActionBasicAccountAuth from "./actions/account-basic-auth";
import ActionVerifyOver18 from "./actions/verify-over-18";
import ActionVerifyFullName from "./actions/verify-full-name";
import ActionVerifyTwitterAccount from "./actions/verify-twitter-account";
import ActionVerifyGithubAccount from "./actions/verify-github-account";
import events from "./events";

export const nuggetsPlugin: Plugin = {
  name: 'plugin-nuggets',
  description: "Generates and returns invite links for specific nuggets functionality, no data is needed from the user to initiate this out of band process. The user should be informed of the verification outcome.",
  config: {
    NUGGETS_OIDC_PROVIDER_URL: process.env.NUGGETS_OIDC_PROVIDER_URL,
    NUGGETS_OIDC_CLIENT_ID: process.env.NUGGETS_OIDC_CLIENT_ID,
    NUGGETS_OIDC_PRIVATE_KEY: process.env.NUGGETS_OIDC_PRIVATE_KEY,
  },
  async init(_config: Record<string, string>, runtime: IAgentRuntime) {
    try {
      const validatedConfig = await validateNuggetsConfig(runtime);

      // Set all environment variables at once
      for (const [key, value] of Object.entries(validatedConfig)) {
        if (value) process.env[key] = value;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Invalid plugin configuration: ${error.errors.map((e) => e.message).join(", ")}`,
        );
      }
      throw error;
    }
  },
  routes: [routeOidcCallback],
  events,
  services: [ServiceNuggets],
  actions: [
    new ActionBasicAccountAuth(),
    new ActionVerifyOver18(),
    new ActionVerifyFullName(),
    new ActionVerifyTwitterAccount(),
    new ActionVerifyGithubAccount(),
  ],
  dependencies: [],
};

export default nuggetsPlugin;
