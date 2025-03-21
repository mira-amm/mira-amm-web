import {describe, it, beforeEach} from "@serenity-js/playwright-test";
import {Duration, Wait} from "@serenity-js/core";
import {Navigate, PageElement, By, Click, isVisible} from "@serenity-js/web";
import {isPresent, not} from "@serenity-js/assertions";

import {
  connectWalletButton,
  swapModule,
  addLiquidityButton,
  header,
  headerLogo,
  headerSwapLink,
  headerLiquidityLink,
  headerBridgeLink,
  headerMainnetText,
  headerConnectWalletButton,
  footer,
  footerLogo,
  footerSupportLink,
  footerMediaKitLink,
  footerSecurityAuditLink,
  footerDocsLink,
  footerBlogLink,
  footerCareersLink,
  footerContactUsLink,
  footerSocialLinks,
} from "./locators";

import {
  Connect,
  CreatePool,
  AdjustSlippage,
  Layout,
  Swap,
  TOKENS,
} from "./tasks";

describe("Wallets", () => {
  [
    "Bako Safe",
    "Fuel Wallet",
    "Fuelet Wallet",
    "Ethereum Wallets",
    "Solana Wallets",
  ].forEach((wallet) => {
    it(`should see option to connect '${wallet}'`, async ({actor}) => {
      await actor.attemptsTo(Connect.toWallet(wallet));
    });
  });
});

describe("Liquidity", () => {
  beforeEach(async ({actor}) => {
    await actor.attemptsTo(Navigate.to("/liquidity"));
  });

  it("should be able to learn more about points program", async ({actor}) => {
    await actor.attemptsTo(
      Wait.upTo(Duration.ofSeconds(10)).until(
        PageElement.located(By.cssContainingText("button", "Learn More ")),
        isVisible(),
      ),
      Click.on(
        PageElement.located(By.cssContainingText("button", "Learn More ")),
      ),
    );
  });

  it("should be able to create volatile pool", async ({actor}) => {
    await actor.attemptsTo(
      CreatePool.ofType("Volatile").withAssets(TOKENS.Base, TOKENS.Quote),
    );
  });

  it("should be able to create stable pool", async ({actor}) => {
    await actor.attemptsTo(
      CreatePool.ofType("Stable").withAssets(TOKENS.Base, TOKENS.Quote),
    );
  });

  it("should be able to add liquidity to existing pool", async ({actor}) => {
    await actor.attemptsTo(
      Wait.upTo(Duration.ofSeconds(10)).until(
        PageElement.located(By.css("Loading pools...")),
        not(isVisible()),
      ),
      Wait.until(addLiquidityButton(), isPresent()),
      Click.on(addLiquidityButton()),
      Wait.until(connectWalletButton(), isVisible()),
    );
  });
});

describe("Swap", () => {
  beforeEach(async ({actor}) => {
    await actor.attemptsTo(Navigate.to("/"));
  });

  it("should see swap module", async ({actor}) => {
    await actor.attemptsTo(Wait.until(swapModule(), isPresent()));
  });

  ["0.1", "0.5"].forEach((value) => {
    it(`should be able to adjust slippage to ${value}%`, async ({actor}) => {
      await actor.attemptsTo(AdjustSlippage.to(value));
    });
  });

  it("should be able to adjust custom slippage", async ({actor}) => {
    await actor.attemptsTo(AdjustSlippage.toCustom("0.7"));
  });

  it("should be able to sell ETH for USDC", async ({actor}) => {
    await actor.attemptsTo(Swap.sell("2", TOKENS.Base), Swap.buy(TOKENS.Quote));
  });

  it("should be able to swap buy and sell currencies", async ({actor}) => {
    await actor.attemptsTo(Swap.sell("2", TOKENS.Base), Swap.convert());
  });
});

describe("Points", () => {
  it("should be able to see leaderboard", async ({actor}) =>
    actor.attemptsTo(
      Navigate.to("/points"),
      Wait.upTo(Duration.ofSeconds(10)).until(
        PageElement.located(By.css("Loading points leaderboard...")),
        not(isVisible()),
      ),
    ));
});

describe("Layout: Header", () => {
  beforeEach(async ({actor}) => {
    await actor.attemptsTo(Navigate.to("/"));
  });

  it("should show header", async ({actor}) =>
    actor.attemptsTo(Layout.shouldShow("header", header())));

  it("should show logo", async ({actor}) =>
    actor.attemptsTo(Layout.shouldShow("logo", headerLogo())));

  it("should show 'Swap' link", async ({actor}) =>
    actor.attemptsTo(Layout.shouldShow("'Swap' link", headerSwapLink())));

  it("should show 'Liquidity' link", async ({actor}) =>
    actor.attemptsTo(
      Layout.shouldShow("'Liquidity' link", headerLiquidityLink()),
    ));

  it("should show 'Bridge' link", async ({actor}) =>
    actor.attemptsTo(Layout.shouldShow("'Bridge' link", headerBridgeLink())));

  it("should show 'Mainnet' text", async ({actor}) =>
    actor.attemptsTo(Layout.shouldShow("'Mainnet' text", headerMainnetText())));

  it("should show 'Connect Wallet' button", async ({actor}) =>
    actor.attemptsTo(
      Layout.shouldShow("'Connect Wallet' button", headerConnectWalletButton()),
    ));
});

describe("Layout: Footer", () => {
  beforeEach(async ({actor}) => {
    await actor.attemptsTo(Navigate.to("/"));
  });

  it("should show footer", async ({actor}) =>
    actor.attemptsTo(Layout.shouldBePresent("footer", footer())));

  it.skip("should show footer logo", async ({actor}) =>
    actor.attemptsTo(Layout.shouldBePresent("footer logo", footerLogo())));

  it("should show 'Support' link", async ({actor}) =>
    actor.attemptsTo(
      Layout.shouldBePresent("Support link", footerSupportLink()),
    ));

  it("should show 'Media Kit' link", async ({actor}) =>
    actor.attemptsTo(
      Layout.shouldBePresent("Media Kit link", footerMediaKitLink()),
    ));

  it("should show 'Security Audit' link", async ({actor}) =>
    actor.attemptsTo(
      Layout.shouldBePresent("Security Audit link", footerSecurityAuditLink()),
    ));

  it("should show 'Docs' link", async ({actor}) =>
    actor.attemptsTo(Layout.shouldBePresent("Docs link", footerDocsLink())));

  it("should show 'Blog' link", async ({actor}) =>
    actor.attemptsTo(Layout.shouldBePresent("Blog link", footerBlogLink())));

  it("should show 'Careers' link", async ({actor}) =>
    actor.attemptsTo(
      Layout.shouldBePresent("Careers link", footerCareersLink()),
    ));

  it("should show 'Contact us' link", async ({actor}) =>
    actor.attemptsTo(
      Layout.shouldBePresent("Contact us link", footerContactUsLink()),
    ));

  it("should allow clicking GitHub link", async ({actor}) =>
    actor.attemptsTo(
      Layout.shouldAllowClick("GitHub link", footerSocialLinks().nth(0)),
    ));

  it("should allow clicking discord link", async ({actor}) =>
    actor.attemptsTo(
      Layout.shouldAllowClick("discord link", footerSocialLinks().nth(1)),
    ));

  it("should allow clicking X link", async ({actor}) =>
    actor.attemptsTo(
      Layout.shouldAllowClick("X link", footerSocialLinks().nth(2)),
    ));
});
