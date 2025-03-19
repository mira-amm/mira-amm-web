import {describe, it} from "@serenity-js/playwright-test";
import {Wait} from "@serenity-js/core";
import {Navigate, PageElement, By, PageElements} from "@serenity-js/web";
import {
  // Ensure,
  // equals,
  isPresent,
} from "@serenity-js/assertions";
import {isVisible} from "@serenity-js/web";

describe("Header", () => {
  const header = () => PageElement.located(By.tagName("header"));
  const headerLogo = () => PageElement.located(By.css("header a svg"));
  const headerSwapLink = () =>
    PageElement.located(By.cssContainingText("header", "Swap"));
  const headerLiquidityLink = () =>
    PageElement.located(By.cssContainingText("header", "Liquidity"));
  const headerBridgeLink = () =>
    PageElement.located(By.cssContainingText("header", "Bridge"));
  const headerMainnetText = () =>
    PageElement.located(By.cssContainingText("header", "Mainnet"));
  const headerConnectWalletButton = () =>
    PageElement.located(By.cssContainingText("header", "Connect Wallet"));

  it("header is visible", async ({actor}) => {
    await actor.attemptsTo(Navigate.to("/"), Wait.until(header(), isVisible()));
  });

  it("logo is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(headerLogo(), isVisible()),
    );
  });

  it("'Swap' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(headerSwapLink(), isVisible()),
    );
  });

  it("'Liquidity' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(headerLiquidityLink(), isVisible()),
    );
  });

  it("'Bridge' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(headerBridgeLink(), isVisible()),
    );
  });

  it("'Mainnet' text is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(headerMainnetText(), isVisible()),
    );
  });

  it("'Connect Wallet' button is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(headerConnectWalletButton(), isVisible()),
    );
  });
});

describe("Footer", () => {
  // TODO: Improve locators during front-end refactor
  const footer = () =>
    PageElement.located(By.css("footer.desktopOnly.Footer_footer__12mlR"));
  const footerLogo = () =>
    PageElement.located(
      By.css("div.Footer_content__BowRn>a.Logo_logo__J4dc0"),
    ).of(footer());
  const footerSupportLink = () =>
    PageElement.located(By.cssContainingText("a", "Support"));
  const footerMediaKitLink = () =>
    PageElement.located(By.cssContainingText("a", "Media Kit"));
  const footerSecurityAuditLink = () =>
    PageElement.located(By.cssContainingText("a", "Security Audit"));
  const footerDocsLink = () =>
    PageElement.located(By.cssContainingText("a", "Docs"));
  const footerBlogLink = () =>
    PageElement.located(By.cssContainingText("a", "Blog"));
  const footerCareersLink = () =>
    PageElement.located(By.cssContainingText("a", "Careers"));
  const footerContactUsLink = () =>
    PageElement.located(By.cssContainingText("a", "Contact us"));

  it("footer is visible", async ({actor}) => {
    console.log(footer());
    await actor.attemptsTo(Navigate.to("/"), Wait.until(footer(), isPresent()));
  });

  it.skip("logo in footer is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(footerLogo(), isPresent()),
    );
  });

  it("'Support' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(footerSupportLink(), isPresent()),
    );
  });

  it("'Media Kit' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(footerMediaKitLink(), isPresent()),
    );
  });

  it("'Security Audit' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(footerSecurityAuditLink(), isPresent()),
    );
  });

  it("'Docs' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(footerDocsLink(), isPresent()),
    );
  });
  it("'Blog' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(footerBlogLink(), isPresent()),
    );
  });
  it("'Careers' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(footerCareersLink(), isPresent()),
    );
  });
  it("'Contact us' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(footerContactUsLink(), isPresent()),
    );
  });
});
