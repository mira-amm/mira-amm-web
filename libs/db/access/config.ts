import {PayloadRequest} from "payload";
import {OAuth2Plugin, defaultGetToken} from "payload-oauth2";
import {getOrUploadMedia} from "@/db/seed";

export const baseConfig = {
  serverURL:
    process.env.NODE_ENV === "development"
      ? process.env.MICROGAME_LOCAL_URL
      : process.env.MICROGAME_PUBLIC_URL,
  authCollection: "users",
  successRedirect: (req: PayloadRequest, accessToken?: string) => {
    const user = req.user;

    const returnURL =
      process.env.NODE_ENV === "development"
        ? `${process.env.MICROGAME_LOCAL_URL}`
        : `${process.env.MICROGAME_PUBLIC_URL}`;

    if (user) {
      if (user.id === 1 || user.group?.name === "Developer") {
        return "/admin/login";
      } else {
        return returnURL;
      }
    }

    return "/";
  },
  failureRedirect: (req: PayloadRequest, err) => {
    req.payload.logger.error(err);
    return "/admin/login";
  },
};

export const twitterStrategyConfig = {
  strategyName: "twitter",
  clientId: process.env.TWITTER_CLIENT_ID || "",
  clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
  authorizePath: "/oauth/twitter",
  callbackPath: "/oauth/twitter/callback",
  tokenEndpoint:
    "https://api.x.com/2/oauth2/token?&state=state&code_challenge=challenge&code_challenge_method=plain",
  providerAuthorizationUrl:
    "https://x.com/i/oauth2/authorize?&state=state&code_challenge=challenge&code_challenge_method=plain",
  enabled:
    typeof process.env.TWITTER_CLIENT_ID === "string" &&
    typeof process.env.TWITTER_CLIENT_SECRET === "string",
  ...baseConfig,
};

// https://twitter.com/developers/docs/topics/oauth2
export const twitterOAuth = OAuth2Plugin({
  useEmailAsIdentity: true,
  scopes: ["users.email", "users.read", "tweet.read"],
  getToken: async (code: string, req: PayloadRequest) => {
    const redirectUri = `${process.env.NEXT_PUBLIC_URL || "http://localhost:8000"}/api/users/oauth/twitter/callback`;

    const tokenResponse = await fetch(
      "https://api.x.com/2/oauth2/token?&state=state&code_challenge=challenge&code_challenge_method=plain",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(
            `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`,
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.TWITTER_CLIENT_ID || "",
          client_secret: process.env.TWITTER_CLIENT_SECRET || "",
          redirect_uri: redirectUri,
          scope: "users.email users.read tweet.read",
          grant_type: "authorization_code",
          code_verifier: "challenge",
        }).toString(),
      },
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData?.access_token;
    if (typeof accessToken !== "string") {
      throw new Error(`No access token: ${tokenData}`);
    }

    return accessToken;
  },
  getUserInfo: async (accessToken: string, req: PayloadRequest) => {
    const headers = {Authorization: `Bearer ${accessToken}`};

    const user = await fetch(
      `https://api.x.com/2/users/me?user.fields=id,confirmed_email,profile_image_url,username,name,is_identity_verified,verified,url`,
      {
        headers,
      },
    ).then((res) => res.json());

    const filename = `${user.data.username.toLowerCase()}-avatar.png`;
    const avatarId = user.data.profile_image_url
      ? await getOrUploadMedia(
          req.payload,
          req,
          user.data.profile_image_url,
          filename,
          `${user.data.username}'s avatar`,
        )
      : null;

    return {
      email: user.data.confirmed_email,
      avatar: avatarId,
      preferredDisplayName: user.data.name,
      xUserName: user.data.username,
      xIsIdentityVerified: user.data.is_identity_verified,
      xVerified: user.data.verified,
      xUrl: user.data.url,
      sub: user.data.id,
    };
  },
  ...twitterStrategyConfig,
});
