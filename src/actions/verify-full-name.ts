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

export class ActionVerifyFullName extends NuggetsBaseAction {
  constructor() {
    const name = "VERIFY_FULL_NAME";
    const similes = [
      "VERIFY_FULLNAME",
      "VERIFY_NAME",
      "VERIFY_USER_FULL_NAME",
      "OIDC_VERIFY_FULL_NAME",
      "PROVE_FULL_NAME",
      "PROVE_NAME",
    ];
    const description =
      "Generates an invite link to start identity verification of a user's full name; a link is generated for the expected functionality, and a string of their verified name is returned upon flow completion. The user should be informed of the verification outcome.";
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
          scope: "profile" as ValidScopes, // profile currently only returns a user's full name
          roomId: message.roomId,
          agentId: runtime.agentId,
          entityId: message.entityId,
        });
        console.log(`[${this.constructor.name}]: Nuggets Invite generated`);

        const response: Content = {
          text: `Here's name verification link for you:`,
          attachments: [
            {
              id: invite.ref,
              url: invite.url,
              title: "Verify Name with Nuggets",
              source: "nuggetsPlugin",
              description:
                "Nuggets full name verification invite, for user full name verification",
              text: "Nuggets full name verification invite, for user full name verification",
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
      const verificationKeywords = ["verify", "name", "full name", "fullname"];
      return verificationKeywords.some((keyword) => userText.includes(keyword));
    };
    const examples: ActionExample[][] = [
      [
        {
          name: "{{user1}}",
          content: {
            text: "I want to verify my full name",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help carry out a name verification check.",
            action: "VERIFY_FULL_NAME",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "I want you to verify my name",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify your name",
            action: "VERIFY_FULL_NAME",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "How do I verify my name?",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I can help you verify your name",
            action: "VERIFY_FULL_NAME",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "Verify my name please",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify your name.",
            action: "VERIFY_FULL_NAME",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "How do I prove my name?",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify your name.",
            action: "VERIFY_FULL_NAME",
          },
        },
      ],
    ];
    super(name, description, similes, examples, handler, validate);
  }
}

export default ActionVerifyFullName;
