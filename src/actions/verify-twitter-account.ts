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
import { ValidScopes } from "../types.js";

export class ActionVerifyTwitterAccount extends NuggetsBaseAction {
  constructor() {
    const name = "VERIFY_TWITTER_ACCOUNT";
    const similes = [
      "VERIFY_X_ACCOUNT",
      "OIDC_TWITTER_ACCOUNT_VERIFICATION",
      "OIDC_X_ACCOUNT_VERIFICATION",
      "PROVE_CONTROL_OVER_TWITTER_ACCOUNT",
      "PROVE_CONTROL_OVER_X_ACCOUNT",
    ];
    const description =
      "Generates an invite link to start verification of a user's twitter (x) account; a link is generated for the expected functionality, and account information is returned upon flow completion";
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
          scope: "social:twitter" as ValidScopes,
          roomId: message.roomId,
          agentId: runtime.agentId,
          entityId: message.entityId,
        });
        console.log(`[${this.constructor.name}]: Nuggets Invite generated`);

        const response: Content = {
          text: `Here's an X (Twitter) verification link for you:`,
          attachments: [
            {
              id: invite.ref,
              url: invite.url,
              title: "Verify Twitter (X) account with Nuggets",
              source: "nuggetsPlugin",
              description:
                "Nuggets twitter (x) account verification invite, for user twitter account verification",
              text: "Nuggets twitter (x) account verification invite, for user twitter account verification",
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
      const verificationKeywords = [
        "verify",
        "twitter",
        "x",
        "account",
        "social",
      ];
      return verificationKeywords.some((keyword) => userText.includes(keyword));
    };
    const examples: ActionExample[][] = [
      [
        {
          name: "{{user1}}",
          content: {
            text: "I want to verify control over a twitter account",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help carry out twitter account verification check.",
            action: "VERIFY_TWITTER_ACCOUNT",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "I want to verify control over an X account",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you carry out an X account verification check.",
            action: "VERIFY_TWITTER_ACCOUNT",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "I want you to verify I control a twitter account",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify control over a twitter account",
            action: "VERIFY_TWITTER_ACCOUNT",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "I want you to verify I control an X account",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify control over an X account",
            action: "VERIFY_TWITTER_ACCOUNT",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "How do I verify my twitter account?",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I can help you verify your twitter account",
            action: "VERIFY_TWITTER_ACCOUNT",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "How do I verify my X account?",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I can help you verify your X account",
            action: "VERIFY_TWITTER_ACCOUNT",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "Verify my twitter account please",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify your twitter account.",
            action: "VERIFY_TWITTER_ACCOUNT",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "Verify my X account please",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify your X account.",
            action: "VERIFY_TWITTER_ACCOUNT",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "How do I prove I control a twitter account?",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify your control over a twitter account.",
            action: "VERIFY_TWITTER_ACCOUNT",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "How do I prove I control an X account?",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify your control over an X account.",
            action: "VERIFY_TWITTER_ACCOUNT",
          },
        },
      ],
    ];
    super(name, description, similes, examples, handler, validate);
  }
}

export default ActionVerifyTwitterAccount;
