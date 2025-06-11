import * as OIDCClient from "openid-client";
import type { Content, HandlerCallback, Memory, UUID } from "@elizaos/core";
import {
  GenerateInviteInput,
  GenerateInviteOutput,
  OIDCQueryResponse,
  OIDCCachedValues,
  OIDCCallbackResponse,
  OIDCUserInfoRespose,
} from "../types";
import cache from "../utils/cache";
import * as jose from "jose";
import { IAgentRuntime, createUniqueUuid } from "@elizaos/core";
import { v4 as uuidv4 } from "uuid";

const response_type = "code";
const response_mode = "jwt";
const grant_types = ["authorization_code", "refresh_token"];
const token_endpoint_auth_method = "private_key_jwt";
const code_challenge_method = 'S256'
const source = "nuggets";

let oidcClientConfig: OIDCClient.Configuration | undefined;
let redirectUri: URL;
let providerRuntime: IAgentRuntime;

export type { OIDCQueryResponse, OIDCCallbackResponse, OIDCUserInfoRespose };

export async function loadOidcClient(runtime: IAgentRuntime) {
  // Generate OIDC Link
  if (oidcClientConfig) {
    return;
  }

  providerRuntime = runtime;

  const providerUrl =
    runtime.getSetting("NUGGETS_OIDC_PROVIDER_URL") ||
    "https://auth-dev.internal-nuggets.life";
  const jwks = JSON.parse(runtime.getSetting("NUGGETS_OIDC_PRIVATE_KEY")).keys;
  const clientId = runtime.getSetting("NUGGETS_OIDC_CLIENT_ID");
  const baseUrl = `${runtime.getSetting("SERVER_URL") || 'http://localhost' }:${runtime.getSetting("SERVER_PORT")}`;

  if (!jwks) {
    throw new Error("Could not load private keys");
  }
  if (!Array.isArray(jwks) && jwks.length) {
    throw new Error("JWKS must be an array of keys");
  }
  if (!providerUrl) {
    throw new Error("OIDC provider URL is not set");
  }
  if (!clientId) {
    throw new Error("OIDC client ID is not set");
  }

  const key = await jose.importJWK(jwks[0])
  
  oidcClientConfig = await OIDCClient.discovery(
    new URL(providerUrl),
    clientId,
    {
      grant_types,
      token_endpoint_auth_method,
      // client_secret: OIDCClient.PrivateKeyJwt(crypto.createPrivateKey(jwks[0]))
    },
    OIDCClient.PrivateKeyJwt(key)
  )

  redirectUri = new URL(`${baseUrl}/api/oidc/callback`);
}

export async function generateOidcInvite(
  runtime: IAgentRuntime,
  input: GenerateInviteInput,
): Promise<GenerateInviteOutput> {
  await loadOidcClient(runtime);

  if (!oidcClientConfig) {
    throw new Error("Failed to load OIDC client");
  }

  const finalScope = `openid ${input.scope}`;
  const code_verifier: string = OIDCClient.randomPKCECodeVerifier()
  const code_challenge = await OIDCClient.calculatePKCECodeChallenge(code_verifier)
  const nonce = OIDCClient.randomNonce();
  let state = uuidv4()

  const authPayload: Record<string, string> = {
    scope: finalScope,
    response_type,
    response_mode,
    state,
    nonce,
    code_challenge,
    code_challenge_method,
    redirect_uri: redirectUri.href,
  };

  /**
   * We cannot be sure the AS supports PKCE so we're going to use state too. Use
   * of PKCE is backwards compatible even if the AS doesn't support it which is
   * why we're using it regardless.
   */
  if (!oidcClientConfig.serverMetadata().supportsPKCE()) {
    state = OIDCClient.randomState()
    authPayload.state = state
  }
  
  const redirectTo = await OIDCClient.buildAuthorizationUrlWithPAR(oidcClientConfig, authPayload)
  
  // cache the nonce, codeVerifier and scope for use in the callback
  cache.set(
    state,
    {
      nonce: nonce,
      code_verifier,
      scope: finalScope,
      agentId: input.agentId,
      roomId: input.roomId,
      entityId: input.entityId,
    } as OIDCCachedValues,
    60 * 2,
    )

  return { url: redirectTo.href, ref: state };
}

export async function callback(
  runtime: IAgentRuntime,
  response: OIDCQueryResponse,
): Promise<OIDCCallbackResponse> {
  if (!oidcClientConfig) {
    throw new Error("Failed to load OIDC client config");
  }

  const { state } = jose.decodeJwt(response.response);

  const cachedValues = await cache.get(state as string);
  if (!cachedValues) {
    throw new Error("No cached values found for state");
  }

  const { nonce, code_verifier, scope, agentId, roomId, entityId } =
    cachedValues as OIDCCachedValues;

  // get tokens for accessing protected endpoints
  let tokens = await OIDCClient.authorizationCodeGrant(oidcClientConfig, redirectUri, {
    pkceCodeVerifier: code_verifier,
    expectedState: state as string,
    expectedNonce: nonce,
  })

  // get user subject from claims
  const claims = tokens.claims()!
  const { sub } = claims

  // fetch the user's shared info
  const userInfo = await OIDCClient.fetchUserInfo(oidcClientConfig, tokens.access_token, sub)

  const type =
    scope.trimEnd() === "openid"
      ? "Auth" // authentication only
      : (userInfo?.proof?.credentialSubject?.type as string) || "unknown";

  const outcome: OIDCCallbackResponse = {
    sub: userInfo.sub,
    ref: state as string,
    type,
  };

  switch (type) {
    case "Twitter":
    case "Github":
      outcome.url = userInfo?.proof?.credentialSubject?.url;
      outcome.username = userInfo?.proof?.credentialSubject?.username;
      outcome.profileImage = userInfo?.proof?.credentialSubject?.profileImage;
      break;
    case "Person":
      userInfo?.proof?.credentialSubject?.givenName &&
        (outcome.givenName = userInfo?.proof?.credentialSubject?.givenName);
      userInfo?.proof?.credentialSubject?.familyName &&
        (outcome.familyName = userInfo?.proof?.credentialSubject?.familyName);
      userInfo?.proof?.credentialSubject?.over18 &&
        (outcome.over18 = userInfo?.proof?.credentialSubject?.over18);
    default:
      break;
  }

  // send response based on outcome
  await replyToConversation(runtime, outcome, { agentId, roomId, entityId });

  return outcome;
}

async function replyToConversation(
  runtime: IAgentRuntime,
  outcome: OIDCCallbackResponse,
  {
    agentId,
    roomId,
    entityId,
  }: { agentId: UUID; roomId: UUID; entityId: UUID },
) {
  const text = determineResponseText(outcome);
  const messageId = createUniqueUuid(runtime, Date.now().toString());
  const content: Content = {
    text,
    attachments: [],
    actions: ["REPLY"],
    source,
    channelType: "OIDC_CALLBACK",
  };

  const message: Memory = {
    id: messageId,
    entityId: agentId,
    agentId,
    roomId,
    content,
    createdAt: Date.now(),
  };

  // Save the incoming message
  await runtime.createMemory(message, "messages");

  // Get the current state
  const state = await runtime.composeState(message);

  // Create response message
  const responseMessage: Memory = {
    id: createUniqueUuid(runtime, messageId),
    entityId,
    agentId,
    content: {
      text,
      actions: ["REPLY"],
      source,
    },
    roomId,
    createdAt: Date.now(),
  };

  // Define callback to handle the response
  const actionCallback: HandlerCallback = async (content: Content) => {
    return [responseMessage];
  };

  await Promise.all([
    // Process the response
    runtime.processActions(message, [message], state, actionCallback),
    // emit message received event
    runtime.emitEvent("MESSAGE_SENT", {
      runtime: providerRuntime,
      message,
      callback: actionCallback,
      source,
    }),
  ]);
}

function determineResponseText(outcome: OIDCCallbackResponse): string {
  if (outcome.type === "Auth") {
    return `You have sucessfully authenticated as ${outcome.sub}`;
  }

  if (outcome.type === "Person") {
    if (outcome.over18) {
      return `You have ${outcome.over18 === "true" ? "passed" : "failed"} over 18 verification`;
    }

    if (outcome.familyName) {
      return `You have verified your name as: ${outcome.givenName} ${outcome.familyName}`;
    }

    return `You have sucessfully authenticated as ${outcome.sub}`;
  }

  if (outcome.type === "Twitter") {
    return `You have verified control of the following Twitter (X) account: @${outcome.username}`;
  }

  if (outcome.type === "Github") {
    return `You have verified control of the following Github account: @${outcome.username}`;
  }

  return `You have sucessfully authenticated as ${outcome.sub}`;
}
