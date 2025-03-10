import {describe, it} from "@serenity-js/playwright-test";
import {Navigate, PageElement, By, PageElements} from "@serenity-js/web";
import {Ensure, equals, isPresent} from "@serenity-js/assertions";
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
    await actor.attemptsTo(
      Navigate.to("/"),
      Ensure.that(header(), isVisible()),
    );
  });

  it("logo is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Ensure.that(headerLogo(), isVisible()),
    );
  });

  it("'Swap' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Ensure.that(headerSwapLink(), isVisible()),
    );
  });

  it("'Liquidity' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Ensure.that(headerLiquidityLink(), isVisible()),
    );
  });

  it("'Bridge' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Ensure.that(headerBridgeLink(), isVisible()),
    );
  });

  it("'Mainnet' text is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Ensure.that(headerMainnetText(), isVisible()),
    );
  });

  it("'Connect Wallet' button is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Ensure.that(headerConnectWalletButton(), isVisible()),
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

  it("footer is visible", async ({actor}) => {
    console.log(footer());
    await actor.attemptsTo(
      Navigate.to("/"),
      Ensure.that(footer(), isPresent()),
    );
  });

  it.skip("logo in footer is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Ensure.that(footerLogo(), isPresent()),
    );
  });

  it("'Support' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Ensure.that(footerSupportLink(), isPresent()),
    );
  });

  it("'Media Kit' link is visible", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Ensure.that(footerMediaKitLink(), isPresent()),
    );
  });
});
