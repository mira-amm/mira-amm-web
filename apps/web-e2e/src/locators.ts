import {PageElement, PageElements, By} from "@serenity-js/web";

export const connectWalletButton = () =>
  PageElements.located(By.cssContainingText("button", "Connect Wallet")).last();

export const walletOption = (walletName: string) =>
  PageElement.located(
    By.cssContainingText("div.fuel-connectors-connector-item", walletName),
  );

export const swapModule = () =>
  PageElement.located(By.css("div[class^='Swap_swapAndRate__']"));

export const sellInput = () =>
  PageElements.located(By.css("[class^='CurrencyBox_input__']")).first();

export const buyInput = () =>
  PageElements.located(By.css("[class^='CurrencyBox_input__']")).last();

export const sellCoinButton = () =>
  PageElements.located(By.css("[class^='CurrencyBox_selector__']")).first();

export const buyCoinButton = () =>
  PageElements.located(By.css("[class^='CurrencyBox_selector__']")).last();

export const swapConvertButton = () =>
  PageElement.located(
    By.css("[class^='IconButton_iconButton__'][class*='Swap_convertButton__']"),
  );

export const searchInput = () =>
  PageElement.located(By.css("[class^='CoinsListModal_tokenSearchInput__']"));

export const searchResults = () =>
  PageElements.located(By.deepCss("[class^='CoinsListModal_tokenListItem__']"));

export const slippageLabel = () =>
  PageElement.located(By.css("[class^='SlippageSetting_slippageLabel__']"));

export const slippageSettingsButton = () =>
  PageElement.located(By.css("div [class^='Swap_heading__'] > button"));

export const slippageSettingsModal = () =>
  PageElement.located(By.css("[class^='Modal_modalWindow__']"));

export const slippageSettingsModalPercentageButton = (percentage: string) =>
  PageElement.located(By.cssContainingText("button", `${percentage}%`));

export const slippageSettingsModalCustomButton = () =>
  PageElement.located(By.cssContainingText("button", "Custom"));

export const slippageSettingsInput = () =>
  PageElement.located(
    By.css("[class^='SettingsModalContent_slippageInput__']"),
  );

//
// ========== LIQUIDITY LOCATORS ==========
//

export const createPoolButton = () =>
  PageElements.located(By.cssContainingText("button", "Create Pool")).last();

export const chooseAssetButtons = () =>
  PageElements.located(By.cssContainingText("p", "Choose Asset"));

export const poolTypeOption = (type: "Volatile" | "Stable") =>
  PageElements.located(By.cssContainingText("div", `${type} pool`)).first();

export const addLiquidityButton = () =>
  PageElements.located(
    By.css(
      'button[class^="ActionButton_btn__"][class*="ActionButton_secondary__"][class*="ActionButton_fullWidth__"]',
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

export const footer = () => PageElement.located(By.css("footer.desktopOnly"));

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
  PageElements.located(By.css('[class^="Footer_socialLink__"]'));
