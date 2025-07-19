import "@/meshwave-ui/tailwind.scss";
import {OAuthButton} from "@/meshwave-ui/oauth-button";

export function OAuthButtons() {
  return (
    <section style={containerStyle}>
      <OAuthButton
        href="/api/users/oauth/twitter"
        iconSrc="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/twitter/twitter-original.svg"
        bgColor="#FFF"
        altText="Twitter(X) Login"
      />
      {/* <OAuthButton
        href="/api/users/oauth/linkedin"
        iconSrc="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linkedin/linkedin-original.svg"
        bgColor="#0077B5"
        altText="LinkedIn Login"
      /> */}
      {/* <OAuthButton
        href="/api/users/oauth/github"
        iconSrc="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg"
        bgColor="green"
        altText="GitHub Login"
      /> */}
      {/* <OAuthButton
        href="/api/users/oauth/discord"
        iconSrc="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/636e0a69f118df70ad7828d4_icon_clyde_blurple_RGB.svg"
        bgColor="#1e2124"
        altText="Discord Login"
      /> */}
      {/* <OAuthButton
        href="/api/users/oauth/google"
        iconSrc="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/google/google-original.svg"
        bgColor="white"
        altText="Google Login"
      /> */}
    </section>
  );
}

export const AfterLogin = () => {
  return (
    <>
      <OAuthButtons />
    </>
  );
};

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
  width: "100%",
  marginBottom: "30px",
};
