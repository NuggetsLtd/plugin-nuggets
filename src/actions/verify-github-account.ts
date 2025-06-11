import {
  ActionExample,
  Handler,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
  Validator,
  Content,
  ContentType,
} from "@elizaos/core";
import { NuggetsBaseAction } from "./nuggets.base.js";
import { generateOidcInvite } from "../providers/oidc.js";
import { validateNuggetsConfig } from "../environment.js";
import { ValidScopes } from "../types";

export class ActionVerifyGithubAccount extends NuggetsBaseAction {
  constructor() {
    const name = "VERIFY_GITHUB_ACCOUNT";
    const similes = [
      "OIDC_GITHUB_ACCOUNT_VERIFICATION",
      "PROVE_CONTROL_OVER_GITHUB_ACCOUNT",
    ];
    const description =
      "Generates an invite link to start verification of a user's github account; a link is generated for the expected functionality, and account information is returned upon flow completion";
    const handler: Handler = async (
      runtime,
      message,
      _state,
      _options?: { [key: string]: unknown },
      _callback?: HandlerCallback,
    ): Promise<boolean> => {
      try {
        console.log(`[${this.constructor.name}]: Generating Nuggets Invite...`);
        const invite = await generateOidcInvite(runtime, {
          scope: "social:github" as ValidScopes,
          roomId: message.roomId,
          agentId: runtime.agentId,
          entityId: message.entityId,
        });
        console.log(`[${this.constructor.name}]: Nuggets Invite generated`);

        const response: Content = {
          text: `Here's a Github verification link for you:`,
          attachments: [
            {
              id: invite.ref,
              url: invite.url,
              title: "Verify Github account with Nuggets",
              source: "nuggetsPlugin",
              description:
                "Nuggets Github account verification invite, for user Github account verification",
              text: "Nuggets Github account verification invite, for user Github account verification",
              contentType: ContentType.LINK,
            },
          ],
          action: "NUGGETS_INVITE_LINK",
        };

        _callback?.(response);

        return true;
      } catch (error) {
        this.handleError(error);
        return false;
      }
    };
    const validate: Validator = async (
      runtime: IAgentRuntime,
      message: Memory,
      _state: State | undefined,
    ): Promise<boolean> => {
      console.log(
        `[${this.constructor.name}]: Current selected action:`,
        this.constructor.name,
      );

      // validate config is as expected
      await validateNuggetsConfig(runtime);

      const userText = message.content.text.toLowerCase();
      const verificationKeywords = ["verify", "github", "account", "social"];
      return verificationKeywords.some((keyword) => userText.includes(keyword));
    };
    const examples: ActionExample[][] = [
      [
        {
          name: "{{user1}}",
          content: {
            text: "I want to verify control over a github account",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help carry out a github account verification check.",
            action: "VERIFY_GITHUB_ACCOUNT",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "I want you to verify I control a github account",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify control over a github account",
            action: "VERIFY_GITHUB_ACCOUNT",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "How do I verify my github account?",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I can help you verify your github account",
            action: "VERIFY_GITHUB_ACCOUNT",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "Verify my Github account please",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify your Github account.",
            action: "VERIFY_GITHUB_ACCOUNT",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "How do I prove I control a github account?",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify your control over a github account.",
            action: "VERIFY_GITHUB_ACCOUNT",
          },
        },
      ],
    ];
    super(name, description, similes, examples, handler, validate);
  }
}

export default ActionVerifyGithubAccount;
