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
import { cl } from "node_modules/@elizaos/core/dist/index-S6eSMHDH.js";

export class ActionBasicAccountAuth extends NuggetsBaseAction {
  constructor() {
    const name = "AUTHENTICATE_USER";
    const similes = [
      "AUTHENTICATE_USER_ACCOUNT",
      "OAUTH_AUTHENTICATION",
      "OIDC_AUTHENTICATION",
      "BASIC_AUTHENTICATION",
      "VERIFY_USER_ACCOUNT_CONTROL",
      "USER_AUTH",
    ];
    const description =
      "Generates an invite link to start basic authentication of a user's account; a link is generated for the expected functionality, and a unique identifier for the user returned upon flow completion";
    const handler: Handler = async (
      runtime,
      message,
      _state,
      _options?: { [key: string]: unknown },
      _callback?: HandlerCallback,
    ): Promise<boolean> => {
      console.log('HANDER_CALLED')
      try {
        console.log(`[${this.constructor.name}]: Generating Nuggets Invite...`);
        const invite = await generateOidcInvite(runtime, {
          scope: "", // basic authentication requires no additional scopes
          roomId: message.roomId,
          agentId: runtime.agentId,
          entityId: message.entityId,
        });
        console.log(`[${this.constructor.name}]: Nuggets Invite generated`);

        const response: Content = {
          text: `Here's an authentication link for you:`,
          attachments: [
            {
              id: invite.ref,
              url: invite.url,
              title: "Authenticate with Nuggets",
              source: "nuggetsPlugin",
              description:
                "Nuggets Authentication invite, for basic user authentication",
              text: "Nuggets Authentication invite, for basic user authentication",
              contentType: ContentType.LINK,
            },
          ],
          action: "NUGGETS_INVITE_LINK",
        };

        _callback?.(response);

        return true;
      } catch (error) {
        console.log('ERRZ', error)
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
        "authenticate",
        "auth",
        "account",
        "connect",
      ];

      return verificationKeywords.some((keyword) => userText.includes(keyword));
    };
    const examples: ActionExample[][] = [
      [
        {
          name: "{{user1}}",
          content: {
            text: "I want to authenticate my account",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help carry out basic authentication on your account.",
            action: "AUTHENTICATE_USER",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "I want to verify my account",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you authenticate your account.",
            action: "AUTHENTICATE_USER",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "How do I authenticate my account?",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I can help you connect and authenticate your account.",
            action: "AUTHENTICATE_USER",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "Verify my account please",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you authenticate your account.",
            action: "AUTHENTICATE_USER",
          },
        },
      ],
    ];
    super(name, description, similes, examples, handler, validate);
  }
}

export default ActionBasicAccountAuth;
