import {
  ActionExample,
  Handler,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
  Validator,
  Content,
  ContentType
} from "@elizaos/core";
import { NuggetsBaseAction } from "./nuggets.base.js";
import { generateOidcInvite } from "../providers/oidc.js";
import { validateNuggetsConfig } from "../environment.js";
import { ValidScopes } from "../types.js";
import { v4 as uuidv4 } from "uuid";

export class ActionVerifyOver18 extends NuggetsBaseAction {
  constructor() {
    const name = "VERIFY_USER_OVER_18";
    const similes = [
      "VERIFY_AGE_OVER_18",
      "CHECK_USER_OVER_18",
      "OIDC_AGE_VERIFICATION",
      "PROVE_OVER_18",
    ];
    const description =
      "Generates an invite link to start identity verification of a user's age being over 18; a link is generated for the expected functionality, and a true/false value returned upon flow completion";
    const handler: Handler = async (
      runtime,
      message,
      _state?,
      _options?: { [key: string]: unknown },
      callback?: HandlerCallback,
    ): Promise<boolean> => {
      try {
        console.log(`[${this.constructor.name}]: Generating Nuggets Invite...`);
        const invite = await generateOidcInvite(runtime, {
          scope: "over18" as ValidScopes,
          roomId: message.roomId,
          agentId: runtime.agentId,
          entityId: message.entityId,
        });
        console.log(`[${this.constructor.name}]: Nuggets Invite generated`);

        const response: Content = {
          text: `Here's an age verification link for you: `,
          attachments: [
            {
              id: invite.ref,
              url: invite.url,
              title: "Verify Age with Nuggets",
              source: "nuggetsPlugin",
              description:
                "Nuggets age verification invite, for user age verification",
              text: "Nuggets age verification invite, for user age verification",
              contentType: ContentType.LINK,
            },
          ],
          actions: ['VERIFY_USER_OVER_18']
        };

        // create message with the generated invite link
        // await runtime.createMemory(
        //   {
        //     content: response,
        //     agentId: runtime.agentId,
        //     roomId: message.roomId,
        //     entityId: message.entityId
        //   },
        //   'messages'
        // );

        // await runtime.sendMessageToTarget({
        //   roomId: message.roomId,
        //   entityId: message.entityId,
        //   source: 'nuggetsPlugin'
        // }, response);

        await callback(response)

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
      const verificationKeywords = ["verify", "over", "18", "age"];

      return verificationKeywords.some((keyword) => userText.includes(keyword));
    };
    const examples: ActionExample[][] = [
      [
        {
          name: "{{user1}}",
          content: {
            text: "I want to verify that I am over 18",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help carry out an age verification check.",
            action: "VERIFY_USER_OVER_18",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "I want you to verify I am over 18",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify you are over 18",
            action: "VERIFY_USER_OVER_18",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "How do I verify I am over 18?",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I can help you verify that you are over 18",
            action: "VERIFY_USER_OVER_18",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "Verify my age as over 18 please",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify your age as over 18.",
            action: "VERIFY_USER_OVER_18",
          },
        },
      ],
      [
        {
          name: "{{user1}}",
          content: {
            text: "How do I prove I am over?",
          },
        },
        {
          name: "{{agentName}}",
          content: {
            text: "I'll help you verify your age as over 18.",
            action: "VERIFY_USER_OVER_18",
          },
        },
      ],
    ];
    super(name, description, similes, examples, handler, validate);
  }
}

export default ActionVerifyOver18;
