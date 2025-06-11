import { UUID } from "@elizaos/core";

export const validReasons = [
  "authenticate",
  "auth",
  "kyb",
  "over18",
  "profile",
  "name",
  "fullname",
  "rightToWork",
  "social:twitter",
  "social:github",
] as const;
export type ValidReasons = (typeof validReasons)[number];

export const validScopes = [
  "", // authentication-only
  "kyb",
  "over18",
  "profile",
  "rightToWork",
  "social:twitter",
  "social:github",
] as const;
export type ValidScopes = (typeof validScopes)[number];

export type OnUserConnect =
  | string
  | {
      uri: string;
      payload: object;
    };

export type GenerateInviteInput = {
  scope: ValidScopes;
  agentId: UUID;
  roomId: UUID;
  entityId: UUID;
};

export type GenerateInviteOutput = {
  url: string;
  ref: string;
};

export type OIDCQueryResponse = {
  response: string;
};

export type OIDCCachedValues = {
  nonce: string;
  code_verifier: string;
  scope: string;
  agentId: UUID;
  roomId: UUID;
  entityId: UUID;
};

export type OIDCCallbackResponse = {
  sub: string;
  ref: string;
  type: string;
  url?: URL;
  username?: string;
  profileImage?: URL;
  givenName?: string;
  familyName?: string;
  over18?: string;
};

export type OIDCUserInfoRespose = {
  [x: string]: any;
  proof: {
    credentialSubject: {
      id?: string;
      type: string;
      [x: string]: any;
    };
  };
};

export type Notification = {
  ref: string;
  status: string;
  outcome?: {
    verified: boolean;
    error?: string;
    proof?: {
      type: string;
      over18?: boolean;
      url?: URL;
      username?: string;
      profileImage?: URL;
    };
  };
};

export type AnyType = any;
