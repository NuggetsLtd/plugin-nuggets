import { type IAgentRuntime, Service, logger } from "@elizaos/core";

export class ServiceNuggets extends Service {
  static serviceType = "nuggets";
  capabilityDescription = "Enables agent to interact with the Nuggets platform";
  constructor(protected runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime) {
    logger.info(
      `*** Starting Nuggets service - MODIFIED: ${new Date().toISOString()} ***`,
    );
    const service = new ServiceNuggets(runtime);
    return service;
  }

  static async stop(runtime: IAgentRuntime) {
    logger.info("*** TESTING DEV MODE - STOP MESSAGE CHANGED! ***");
    // get the service from the runtime
    const service = runtime.getService(ServiceNuggets.serviceType);
    if (!service) {
      throw new Error("Nuggets service not found");
    }
    service.stop();
  }

  async stop() {
    // Close connections, release resources
  }
}

export default ServiceNuggets;
