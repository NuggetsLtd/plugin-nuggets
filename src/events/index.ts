import { logger, Plugin } from "@elizaos/core";

export const events: Plugin["events"] = {
  MESSAGE_RECEIVED: [
    async (params) => {
      logger.debug("MESSAGE_RECEIVED event received");
      // print the keys
      logger.debug(Object.keys(params));
    },
  ],
  VOICE_MESSAGE_RECEIVED: [
    async (params) => {
      logger.debug("VOICE_MESSAGE_RECEIVED event received");
      // print the keys
      logger.debug(Object.keys(params));
    },
  ],
  WORLD_CONNECTED: [
    async (params) => {
      logger.debug("WORLD_CONNECTED event received");
      // print the keys
      logger.debug(Object.keys(params));
    },
  ],
  WORLD_JOINED: [
    async (params) => {
      logger.debug("WORLD_JOINED event received");
      // print the keys
      logger.debug(Object.keys(params));
    },
  ],
};

export default events;
