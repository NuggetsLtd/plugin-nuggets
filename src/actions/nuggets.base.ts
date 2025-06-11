import { AnyType } from "../types";
import { Action, ActionExample, Validator, Handler } from "@elizaos/core";
import axios, { AxiosInstance } from "axios";

export abstract class NuggetsBaseAction implements Action {
  protected client: AxiosInstance;

  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly similes: string[],
    public readonly examples: ActionExample[][],
    public readonly handler: Handler,
    public readonly validate: Validator,
  ) {
    this.name = name;
    this.description = description;
    this.similes = similes;
    this.examples = examples;
    this.handler = handler;
    this.validate = validate;

    this.client = axios.create({
      baseURL: "http://localhost:3016/api/",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 5 * 60 * 1000,
    });
  }

  protected handleError(error: AnyType): void {
    if (axios.isAxiosError(error)) {
      console.dir(error.response?.data, { depth: null });
      throw new Error(
        `Nuggets Communicator API error: ${error.response?.data?.message || error.message}`,
      );
    }
  }
}
