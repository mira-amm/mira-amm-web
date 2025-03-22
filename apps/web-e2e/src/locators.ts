import {PageElement, PageElements, By} from "@serenity-js/web";

export const connectWalletButton = () =>
  PageElements.located(
    By.cssContainingText(
      "button",
      "Connect Wallet",
    ),
  ).last();

export const walletOption = (walletName: string) =>
  PageElement.located(
    By.cssContainingText("div.fuel-connectors-connector-item", walletName),
  );

export const swapModule = () =>
  PageElement.located(By.css("div.Swap_swapAndRate__7ZIhj"));

export const sellInput = () =>
  PageElements.located(By.css(".CurrencyBox_input__7lBMk")).first();

export const buyInput = () =>
  PageElements.located(By.css(".CurrencyBox_input__7lBMk")).last();

export const sellCoinButton = () =>
  PageElements.located(By.css(".CurrencyBox_selector__JrCLa")).first();

export const buyCoinButton = () =>
  PageElements.located(By.css(".CurrencyBox_selector__JrCLa")).last();

export const swapConvertButton = () =>
  PageElement.located(
    By.css(".IconButton_iconButton___GOzQ.Swap_convertButton__unBzD"),
  );

export const searchInput = () =>
  PageElement.located(By.css(".CoinsListModal_tokenSearchInput__TWcHY"));

export const searchResults = () =>
  PageElements.located(By.deepCss(".CoinsListModal_tokenListItem__oeJhZ"));

export const slippageLabel = () =>
  PageElement.located(By.css(".SlippageSetting_slippageLabel___IHXt"));

export const slippageSettingsButton = () =>
  PageElement.located(By.css("div .Swap_heading__CjEVx > button"));

export const slippageSettingsModal = () =>
  PageElement.located(By.css(".Modal_modalWindow__S7LXs"));

export const slippageSettingsModalPercentageButton = (percentage: string) =>
  PageElement.located(By.cssContainingText("button", `${percentage}%`));

export const slippageSettingsModalCustomButton = () =>
  PageElement.located(By.cssContainingText("button", "Custom"));

export const slippageSettingsInput = () =>
  PageElement.located(By.css(".SettingsModalContent_slippageInput___szna"));

//
// ========== LIQUIDITY LOCATORS ==========
//

export const createPoolButton = () =>
  PageElements.located(
    By.css("button.ActionButton_btn__fm8nx.DesktopPools_createButton__Qt8xv"),
  ).last();

export const chooseAssetButtons = () =>
  PageElements.located(
    By.css(".CoinInput_coinInputLine__mZnrF.CoinInput_rightColumn__Wjw0X"),
  );

export const poolTypeOption = (type: "Volatile" | "Stable") =>
  PageElements.located(By.cssContainingText("div", `${type} pool`)).first();

export const addLiquidityButton = () =>
  PageElements.located(
    By.css(
      "button.ActionButton_btn__fm8nx.ActionButton_secondary__gLMKU.ActionButton_fullWidth__RUwiV",
    ),
  ).nth(12);

//
// ========== LAYOUT LOCATORS: HEADER ==========
//

export const header = () => PageElement.located(By.tagName("header"));

export const headerLogo = () => PageElement.located(By.css("header a svg"));

export const headerSwapLink = () =>
  PageElement.located(By.cssContainingText("header", "Swap"));

export const headerLiquidityLink = () =>
  PageElement.located(By.cssContainingText("header", "Liquidity"));

export const headerBridgeLink = () =>
  PageElement.located(By.cssContainingText("header", "Bridge"));

export const headerMainnetText = () =>
  PageElement.located(By.cssContainingText("header", "Mainnet"));

export const headerConnectWalletButton = () =>
  PageElement.located(By.cssContainingText("header", "Connect Wallet"));

//
// ========== LAYOUT LOCATORS: FOOTER ==========
//

export const footer = () =>
  PageElement.located(By.css("footer.desktopOnly.Footer_footer__12mlR"));

export const footerLogo = () =>
  PageElement.located(
    By.css("div.Footer_content__BowRn>a.Logo_logo__J4dc0"),
  ).of(footer());

export const footerSupportLink = () =>
  PageElement.located(By.cssContainingText("a", "Support"));

export const footerMediaKitLink = () =>
  PageElement.located(By.cssContainingText("a", "Media Kit"));

export const footerSecurityAuditLink = () =>
  PageElement.located(By.cssContainingText("a", "Security Audit"));

export const footerDocsLink = () =>
  PageElement.located(By.cssContainingText("a", "Docs"));

export const footerBlogLink = () =>
  PageElement.located(By.cssContainingText("a", "Blog"));

export const footerCareersLink = () =>
  PageElement.located(By.cssContainingText("a", "Careers"));

export const footerContactUsLink = () =>
  PageElement.located(By.cssContainingText("a", "Contact us"));

export const footerSocialLinks = () =>
  PageElements.located(By.css(".Footer_socialLink__bvMZ6"));
