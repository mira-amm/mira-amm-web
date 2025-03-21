import {Task, Duration, Wait} from "@serenity-js/core";
import {
  Click,
  By,
  Enter,
  Navigate,
  PageElement,
  Press,
  Text,
  isVisible,
} from "@serenity-js/web";
import {
  Ensure,
  equals,
  includes,
  not,
  isPresent,
} from "@serenity-js/assertions";

import {
  connectWalletButton,
  walletOption,
  createPoolButton,
  chooseAssetButtons,
  searchResults,
  searchInput,
  poolTypeOption,
  slippageLabel,
  slippageSettingsButton,
  slippageSettingsModal,
  slippageSettingsModalPercentageButton,
  slippageSettingsModalCustomButton,
  slippageSettingsInput,
  sellInput,
  sellCoinButton,
  buyCoinButton,
  swapConvertButton,
} from "./locators";

export const TOKENS = {
  Base: "ETH",
  Quote: "USDC",
};

export const Connect = {
  toWallet: (walletName: string) =>
    Task.where(
      `#actor connects to ${walletName}`,
      Navigate.to("/"),
      Wait.until(connectWalletButton(), isVisible()),
      Click.on(connectWalletButton()),
      Wait.until(walletOption(walletName), isVisible()),
    ),
};

export const CreatePool = {
  ofType: (type: "Volatile" | "Stable") => ({
    withAssets: (base: string, quote: string) =>
      Task.where(
        `#actor creates a ${type} pool with ${base} and ${quote}`,
        Navigate.to("/liquidity"),
        Wait.upTo(Duration.ofSeconds(10)).until(
          PageElement.located(By.css("Loading pools...")),
          not(isVisible()),
        ),
        Wait.until(createPoolButton(), isVisible()),
        Click.on(createPoolButton()),
        Wait.until(chooseAssetButtons().first(), isVisible()),
        Click.on(chooseAssetButtons().first()),
        Wait.until(searchResults().first(), isVisible()),
        Enter.theValue(base).into(searchInput()),
        Press.the("Enter"),
        Wait.until(searchResults().first(), isVisible()),
        Click.on(searchResults().first()),
        Click.on(chooseAssetButtons().last()),
        Wait.until(searchResults().first(), isVisible()),
        Enter.theValue(quote).into(searchInput()),
        Press.the("Enter"),
        Wait.until(searchResults().first(), isVisible()),
        Click.on(searchResults().first()),
        Wait.until(poolTypeOption(type), isVisible()),
        Click.on(poolTypeOption(type)),
      ),
  }),
};

export const SelectToken = {
  called: (token: string) => ({
    into: (button: PageElement<unknown>) =>
      Task.where(
        `#actor selects token ${token}`,
        Click.on(button),
        Wait.until(searchResults().first(), isVisible()),
        Enter.theValue(token).into(searchInput()),
        Press.the("Enter"),
        Wait.until(searchResults().first(), isVisible()),
        Click.on(searchResults().first()),
        Wait.until(button, isVisible()),
        Wait.until(Text.of(button), includes(token)),
      ),
  }),
};

export const AdjustSlippage = {
  to: (value: string) =>
    Task.where(
      `#actor adjusts slippage to ${value}%`,
      Wait.until(slippageLabel(), isPresent()),
      Wait.until(slippageSettingsButton(), isPresent()),
      slippageSettingsButton().click(),
      Wait.until(slippageSettingsModal(), isPresent()),
      Wait.until(slippageSettingsModalPercentageButton(value), isPresent()),
      slippageSettingsModalPercentageButton(value).click(),
      Ensure.that(Text.of(slippageLabel()), equals(`${value}% slippage`)),
    ),

  toCustom: (value: string) =>
    Task.where(
      `#actor adjusts custom slippage to ${value}%`,
      Wait.until(slippageLabel(), isPresent()),
      Wait.until(slippageSettingsButton(), isPresent()),
      slippageSettingsButton().click(),
      Wait.until(slippageSettingsModal(), isPresent()),
      Wait.until(slippageSettingsModalCustomButton(), isPresent()),
      Click.on(slippageSettingsModalCustomButton()),
      slippageSettingsInput().enterValue(`${value}%`),
      Press.the("Enter"),
      Press.the("Escape"),
      Ensure.that(Text.of(slippageLabel()), equals(`${value}% slippage`)),
    ),
};

export const Layout = {
  shouldShow: (description: string, locator: PageElement<unknown>) =>
    Task.where(`#actor sees ${description}`, Wait.until(locator, isVisible())),

  shouldBePresent: (description: string, locator: PageElement<unknown>) =>
    Task.where(
      `#actor sees ${description} present`,
      Wait.until(locator, isPresent()),
    ),

  shouldAllowClick: (description: string, locator: PageElement<unknown>) =>
    Task.where(`#actor can click ${description}`, Click.on(locator)),
};

export const Swap = {
  sell: (amount: string, token: string) =>
    Task.where(
      `#actor sells ${amount} ${token}`,
      Wait.until(sellInput(), isVisible()),
      sellInput().enterValue(amount),
      SelectToken.called(token).into(sellCoinButton()),
    ),

  buy: (token: string) =>
    Task.where(
      `#actor selects ${token} to buy`,
      SelectToken.called(token).into(buyCoinButton()),
    ),

  convert: () =>
    Task.where(
      `#actor swaps sell/buy tokens`,
      Click.on(swapConvertButton()),
      Wait.until(Text.of(buyCoinButton()), includes(TOKENS.Base)),
    ),
};
