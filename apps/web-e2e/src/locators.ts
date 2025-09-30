import {PageElement, PageElements, By} from "@serenity-js/web";

export const connectWalletButton = () =>
  PageElements.located(By.cssContainingText("button", "Connect Wallet")).last();

export const walletOption = (walletName: string) =>
  PageElement.located(
    By.cssContainingText("div.fuel-connectors-connector-item", walletName)
  );

export const swapModule = () =>
  PageElement.located(By.cssContainingText("p", "Swap"));

export const sellInput = () =>
  PageElements.located(By.css("div input")).first();

export const buyInput = () => PageElements.located(By.css("div input")).last();

export const sellCoinButton = () =>
  PageElements.located(By.css("main input+button")).first();

export const buyCoinButton = () =>
  PageElements.located(By.css("main input+button")).last();

export const swapConvertButton = () =>
  PageElements.located(By.css("main button svg")).nth(3);

export const searchInput = () =>
  PageElement.located(
    By.css("input[placeholder^='Search by token or paste address']")
  );

export const searchResults = () =>
  PageElements.located(
    By.css(
      "div:has(> input[placeholder^='Search by token or paste address']) + div > div"
    )
  );

export const slippageLabel = () =>
  PageElement.located(By.cssContainingText("p", "% Slippage"));

export const slippageSettingsButton = () =>
  PageElement.located(By.css("button svg.lucide-settings"));

export const slippageSettingsModal = () =>
  process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI
    ? PageElement.located(By.cssContainingText("div", "Slippage tolerance"))
    : PageElement.located(By.cssContainingText("p", "Settings"));

export const slippageSettingsModalPercentageButton = (percentage: string) =>
  PageElement.located(By.cssContainingText("button", `${percentage}%`));

export const slippageSettingsModalCustomButton = () =>
  process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI
    ? PageElement.located(By.css("[aria-label='Custom slippage percentage']"))
    : PageElement.located(By.cssContainingText("button", "Custom"));

export const slippageSettingsInput = () =>
  PageElements.located(By.css("input")).last();

//
// ========== LIQUIDITY LOCATORS ==========
//

export const createPoolButton = () =>
  PageElement.located(By.css("[data-test-id='create-pool-button']"));

export const chooseAssetButtons = () =>
  PageElements.located(By.cssContainingText("p", "Choose Asset"));

export const poolTypeOption = (type: "Volatile" | "Stable") =>
  PageElements.located(By.cssContainingText("div", `${type} pool`)).first();

export const addLiquidityButton = () =>
  PageElements.located(
    By.xpath(
      "//div[contains(.,'FUEL/USDC')]//button[contains(text(),'Add Liquidity')]"
    )
  ).first();

//
// ========== LAYOUT LOCATORS: HEADER ==========
//

export const header = () => PageElement.located(By.tagName("header"));

export const headerLogo = () =>
  PageElement.located(By.css("header a[href='/'] svg"));

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

export const footer = () => PageElement.located(By.css("footer"));

export const footerLogo = () => PageElement.located(By.css("footer div a"));

export const footerSupportLink = () =>
  PageElement.located(By.cssContainingText("a", "Support"));

export const footerSecurityAuditLink = () =>
  PageElement.located(By.cssContainingText("a", "Security Audit"));

export const footerDocsLink = () =>
  PageElement.located(By.cssContainingText("a", "Docs"));

export const footerBlogLink = () =>
  PageElement.located(By.cssContainingText("a", "Blog"));

export const footerContactUsLink = () =>
  PageElement.located(By.cssContainingText("a", "Contact us"));

//
// ========== CREATE POOL (V2 CONCENTRATED) & PREVIEW LOCATORS ==========
//

export const concentratedPoolV2Option = () =>
  PageElement.located(By.css("[data-test-id='concentrated-pool-v2-option']"));

export const previewSelectBinStepLabel = () =>
  PageElement.located(By.cssContainingText("p", "Select Bin Step"));

export const previewEnterActivePriceLabel = () =>
  PageElement.located(By.cssContainingText("span", "Enter active price"));

export const previewCreationButton = () =>
  PageElement.located(By.cssContainingText("button", "Preview creation"));

//
// ========== POSITION VIEW LOCATORS ==========
//

export const positionSimulationContainer = () =>
  PageElement.located(By.css("[data-test-id='position-simulation-container']"));

//
// ========== REMOVE LIQUIDITY LOCATORS ==========
//

export const removeLiquidityAlertTitle = () =>
  PageElement.located(By.cssContainingText("p", "Pay attention"));

//
// ========== ADD BIN LIQUIDITY (V2) LOCATORS ==========
//

export const addV2SimulationHeader = () =>
  PageElement.located(By.cssContainingText("h3", "Simulated distribution"));

export const addV2SimulationChart = () =>
  PageElement.located(By.css("div.h-40 > div.relative.h-40"));

export const addV2DepositFirstInput = () =>
  PageElements.located(By.css('input[placeholder="0"]')).first();

export const addV2DepositSecondInput = () =>
  PageElements.located(By.css('input[placeholder="0"]')).last();

export const addV2MinPriceInput = () =>
  PageElement.located(By.css("label:has-text('Min price') + div input"));

export const addV2MaxPriceInput = () =>
  PageElement.located(By.css("label:has-text('Max price') + div input"));

export const addV2NumBinsInput = () =>
  PageElement.located(By.css('input[type="number"]'));

export const addV2ResetPriceButton = () =>
  PageElement.located(By.cssContainingText("button", "Reset price"));

export const addLiquidityDepositInputs = () =>
  PageElements.located(By.css("input[placeholder='0']"));

export const addV2SliderMinThumb = () =>
  PageElement.located(By.css("[aria-label='Minimum price']"));

export const addV2SliderMaxThumb = () =>
  PageElement.located(By.css("[aria-label='Maximum price']"));
