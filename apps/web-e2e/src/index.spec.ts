import {describe, it} from "@serenity-js/playwright-test";
import {Navigate, PageElement, By} from "@serenity-js/web";
import {Ensure, equals} from "@serenity-js/assertions";
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
