import { PayloadRequest } from "payload";
import { OAuth2Plugin } from "payload-oauth2";
import { getOrUploadMedia } from "@/db/seed";

const IS_DEV = process.env.NODE_ENV === "development";
const BASE_URL = IS_DEV
  ? process.env.ADMIN_LOCAL_URL!
  : process.env.ADMIN_PUBLIC_URL!;
const TWITTER_SCOPES = ["users.email", "users.read", "tweet.read"];

export const baseConfig = {
  serverURL: BASE_URL,
  authCollection: "users",
  successRedirect: (req: PayloadRequest) => {
    const user = req.user;
    // TODO: implement role-based-access-control
    return user?.roles?.includes("admin") ? "/admin" : "/";
  },

  failureRedirect: (req: PayloadRequest, err: unknown) => {
    req.payload.logger.error(err);
    return "/";
  },
};

export const twitterStrategyConfig = {
  strategyName: "twitter",
  clientId: process.env.TWITTER_CLIENT_ID!,
  clientSecret: process.env.TWITTER_CLIENT_SECRET!,
  authorizePath: "/oauth/twitter",
  callbackPath: "/oauth/twitter/callback",
  tokenEndpoint: "https://api.x.com/2/oauth2/token",
  providerAuthorizationUrl: `https://x.com/i/oauth2/authorize?${new URLSearchParams({
    state: "state",
    code_challenge: "challenge",
    code_challenge_method: "plain", // Should be 'S256' in real usage
  }).toString()}`,
  enabled: true,
  ...baseConfig,
};

export const twitterOAuth = OAuth2Plugin({
  useEmailAsIdentity: true,
  scopes: TWITTER_SCOPES,
  getToken: async (code: string, req: PayloadRequest) => {
    const redirectUri = `${BASE_URL}/api/users/oauth/twitter/callback`;

    // TODO: implement code verifier algorithm
    // const codeVerifier = req.cookies?.code_verifier;
    // if (!codeVerifier) {
    //   throw new Error("Missing PKCE code_verifier");
    // }

    const body = new URLSearchParams({
      code,
      client_id: process.env.TWITTER_CLIENT_ID!,
      client_secret: process.env.TWITTER_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      scope: TWITTER_SCOPES.join(" "),
      grant_type: "authorization_code",
      code_verifier: "challenge",
    });

    const tokenResponse = await fetch("https://api.x.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(
          `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`,
        ).toString("base64")}`,
      },
      body: body.toString(),
    });

    const tokenData = await tokenResponse.json();

    if (typeof tokenData?.access_token !== "string") {
      throw new Error(`No access token received: ${JSON.stringify(tokenData)}`);
    }

    return tokenData.access_token;
  },

  getUserInfo: async (accessToken: string, req: PayloadRequest) => {
    try {
      const headers = { Authorization: `Bearer ${accessToken}` };

      const userResponse = await fetch(
        `https://api.x.com/2/users/me?${new URLSearchParams({
          "user.fields":
            "id,confirmed_email,profile_image_url,username,name,is_identity_verified,verified,url",
        })}`,
        { headers },
      );

      if (!userResponse.ok) {
        throw new Error(
          `Failed to fetch user data: ${userResponse.status} ${userResponse.statusText}`,
        );
      }

      const { data: userData } = await userResponse.json();

      if (!userData?.id || !userData?.username) {
        throw new Error("Incomplete user data from Twitter");
      }

      const [existingUser] = (
        await req.payload.find({
          collection: "users",
          where: { sub: { equals: userData.id } },
          limit: 1,
        })
      ).docs;

      if (existingUser) {
        req.payload.logger.info(`User found: ${existingUser.email}`);
        return {
          email: existingUser.email,
          sub: existingUser.sub,
        };
      }

      const avatarId = userData.profile_image_url
        ? await getOrUploadMedia(
            req.payload,
            req,
            userData.profile_image_url,
            `${userData.username.toLowerCase()}-avatar.png`,
            `${userData.username}'s avatar`,
          )
        : null;

      req.payload.logger.info(`Creating new user: ${userData.username}`);

      return {
        email: userData.confirmed_email,
        avatar: avatarId,
        name: userData.name,
        xUserName: userData.username,
        xIsIdentityVerified: userData.is_identity_verified,
        xVerified: userData.verified,
        xUrl: userData.url,
        sub: userData.id,
      };
    } catch (error) {
      req.payload.logger.error(
        `getUserInfo error: ${error instanceof Error ? error.stack : String(error)}`,
      );
      throw new Error("Unable to fetch user info from Twitter/X.");
    }
  },

  ...twitterStrategyConfig,
});
