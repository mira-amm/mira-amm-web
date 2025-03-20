import {describe, it} from "@serenity-js/playwright-test";
import {Wait} from "@serenity-js/core";
import {
  Navigate,
  PageElement,
  By,
  PageElements,
  Text,
  Press,
  Click,
  Enter,
} from "@serenity-js/web";

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

describe("swap", () => {
  const swapModule = () =>
    PageElement.located(By.css("div.Swap_swapAndRate__7ZIhj"));

  it("should see swap module", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(swapModule(), isPresent()),
    );
  });

  const slippageLabel = () =>
    PageElement.located(By.css(".SlippageSetting_slippageLabel___IHXt"));
  const slippageSettingsButton = () =>
    PageElement.located(By.css("div .Swap_heading__CjEVx > button"));
  const slippageSettingsModal = () =>
    PageElement.located(By.css(".Modal_modalWindow__S7LXs"));
  const slippageSettingsModalPercentageButton = (percentage: string) =>
    PageElement.located(By.cssContainingText("button", `${percentage}%`));
  const slippageSettingsInput = () =>
    PageElement.located(By.css(".SettingsModalContent_slippageInput___szna"));

  const slippageValues = ["0.1", "0.5"];

  slippageValues.forEach((value) => {
    it(`should be able to adjust slippage to ${value}%`, async ({actor}) => {
      await actor.attemptsTo(
        Navigate.to("/"),
        Wait.until(slippageLabel(), isPresent()),
        Wait.until(slippageSettingsButton(), isPresent()),
        slippageSettingsButton().click(),
        Wait.until(slippageSettingsModal(), isPresent()),
        Wait.until(slippageSettingsModalPercentageButton(value), isPresent()),
        slippageSettingsModalPercentageButton(value).click(),
        Ensure.that(Text.of(slippageLabel()), equals(`${value}% slippage`)),
      );
    });
  });

  const slippageSettingsModalCustomButton = () =>
    PageElement.located(By.cssContainingText("button", `Custom`));

  it(`should be able to adjust custom slippage`, async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(slippageLabel(), isPresent()),
      Wait.until(slippageSettingsButton(), isPresent()),
      slippageSettingsButton().click(),
      Wait.until(slippageSettingsModal(), isPresent()),
      Wait.until(slippageSettingsModalCustomButton(), isPresent()),
      Click.on(slippageSettingsModalCustomButton()),
      slippageSettingsInput().enterValue("0.7%"),
      Press.the("Enter"),
      Press.the("Escape"),
      Ensure.that(Text.of(slippageLabel()), equals(`0.7% slippage`)),
    );
  });

  const sellInput = () =>
    PageElements.located(By.css(".CurrencyBox_input__7lBMk")).first();
  const buyInput = () =>
    PageElements.located(By.css(".CurrencyBox_input__7lBMk")).last();
  const sellCoinButton = () =>
    PageElements.located(By.css(".CurrencyBox_selector__JrCLa")).first();
  const buyCoinButton = () =>
    PageElements.located(By.css(".CurrencyBox_selector__JrCLa")).last();
  const searchInput = () =>
    PageElement.located(By.css(".CoinsListModal_tokenSearchInput__TWcHY"));
  const searchResults = () =>
    PageElements.located(By.css(".CoinsListModal_tokenListItem__oeJhZ"));
  const swapConvertButton = () =>
    PageElement.located(
      By.css(".IconButton_iconButton___GOzQ.Swap_convertButton__unBzD"),
    );

  it(`should be able to sell ETH for USDC`, async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(sellInput(), isPresent()),
      sellInput().enterValue("2"),
      Click.on(sellCoinButton()),
      Wait.until(searchResults().first(), isPresent()),
      Enter.theValue("ETH").into(searchInput()),
      Wait.until(searchResults().first(), isPresent()),
      Click.on(searchResults().first()),
      Wait.until(sellCoinButton(), isVisible()),
      Ensure.that(Text.of(sellCoinButton()), equals("ETH")),
      Click.on(buyCoinButton()),
      Wait.until(searchResults().first(), isPresent()),
      Enter.theValue("USDC").into(searchInput()),
      Wait.until(searchResults().first(), isPresent()),
      Click.on(searchResults().first()),
      Wait.until(buyCoinButton(), isVisible()),
      Ensure.that(Text.of(sellCoinButton()), equals("USDC")),
      Ensure.that(Text.of(buyCoinButton()), equals("ETH")),
      Wait.until(swapConvertButton(), isVisible()),
      Click.on(swapConvertButton()),
      Ensure.that(Text.of(buyCoinButton()), equals("USDC")),
      Ensure.that(Text.of(sellCoinButton()), equals("ETH")),
    );
  });
});
