import {chromium, Page, type BrowserContext} from "@playwright/test";
import {
  Navigate,
  PageElement,
  PageElements,
  By,
  Click,
  Scroll,
  isVisible,
  Press,
  Enter,
} from "@serenity-js/web";
import {Duration, Wait} from "@serenity-js/core";

import {Ensure, equals, isPresent, not} from "@serenity-js/assertions";

import {GetRequest, LastResponse, Send} from "@serenity-js/rest";

import {
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
  footerSecurityAuditLink,
  footerDocsLink,
  footerBlogLink,
  footerContactUsLink,
  // footerSocialLinks, // TODO: implement selectors & assertions
  createPoolButton,
  chooseAssetButtons,
  searchInput,
  searchResults,
  concentratedPoolV2Option,
  previewSelectBinStepLabel,
  previewEnterActivePriceLabel,
  previewCreationButton,
  positionSimulationContainer,
  removeLiquidityAlertTitle,
  removeBinLiquidityPriceSummary,
  addV2SimulationHeader,
  addV2ResetPriceButton,
} from "./locators";

import {
  Connect,
  CreatePool,
  AdjustSlippage,
  Layout,
  Swap,
  TOKENS,
} from "./tasks";

import {Provider} from "fuels";

import {useBase, describe, it, beforeEach} from "@serenity-js/playwright-test";

import {test as fuelsBase, downloadFuel} from "@fuels/playwright-utils";

import {FuelWalletTestHelper} from "./fuelWalletTestHelper";

describe.serial("With connected wallet", () => {
  const {it} = useBase(fuelsBase).useFixtures<{
    context: BrowserContext;
    page: Page;
    pathToExtension: string;
    fuelWalletVersion: string;
    fuelWalletTestHelper: FuelWalletTestHelper;
  }>({
    fuelWalletVersion: "0.58.0",
    pathToExtension: async ({fuelWalletVersion}, use) => {
      const fuelPath = await downloadFuel(fuelWalletVersion);
      await use(fuelPath);
    },
    context: async ({pathToExtension}, use) => {
      const context = await chromium.launchPersistentContext("", {
        channel: "chromium",
        headless: false,
        args: [
          `--disable-extensions-except=${pathToExtension}`,
          `--load-extension=${pathToExtension}`,
        ],
      });

      await use(context);
      await context.close();
    },
    fuelWalletTestHelper: async ({context}, use) => {
      // TODO: switch over to testnet
      const fuelProvider = new Provider(
        "https://mainnet.fuel.network/v1/graphql"
      );
      const mnemonic =
        process.env.FUEL_WALLET_MNEMONIC ??
        "demand fashion unaware upgrade upon heart bright august panel kangaroo want gaze";
      const password = process.env.FUEL_WALLET_PASSWORD ?? "$123Ran123Dom123!";

      let [background] = context.serviceWorkers();
      if (!background) background = await context.waitForEvent("serviceworker");
      const extensionId = background.url().split("/")[2];

      const helper = await FuelWalletTestHelper.walletSetup({
        context,
        fuelExtensionId: extensionId,
        fuelProvider: {
          url: fuelProvider.url,
          chainId: await fuelProvider.getChainId(),
        },
        chainName: "microchain-testnet", // HACK: fuel's playwright utils fail if this string matches any existing networks, such as "Ignition", or "Fuel Sepolia Testnet". Tried "microchain-local" but that caused a selector error.
        mnemonic,
        password,
      });

      await use(helper);
    },
    // actors: async ({ browser, contextOptions }, use) => {
    //       const cast = Cast.where(actor => actor.whoCan(
    //           BrowseTheWebWithPlaywright.using(browser, {
    //               ...contextOptions,
    //               userAgent: `${ actor.name }`
    //           }),
    //       ))
    //       await use(cast)
    //   },
  });

  it("should be able to interact with swap & liquidity", async ({
    fuelWalletTestHelper,
    actor,
    page,
  }, use) => {
    await page.goto("/");
    await page.bringToFront();

    await page.getByRole("button", {name: "Connect Wallet"}).click();
    await page.getByLabel("Connect to Fuel Wallet").click();
    await fuelWalletTestHelper.walletConnect();
    await page.getByRole("button", {name: "Sign and Confirm"}).click();

    await actor.attemptsTo(
      Wait.until(
        PageElements.located(
          By.cssContainingText("button", "DISCONNECT")
        ).last(),
        isPresent()
      ),
      Ensure.that(
        PageElement.located(By.cssContainingText("button", "Input amounts")),
        isPresent()
      )
    );

    await page.locator("input").last().fill("1");
    await page.getByRole("button", {name: "Review"}).click();
    await page.getByRole("button", {name: "Swap"}).click();
    await fuelWalletTestHelper.walletReject();
    // await page.getByRole('button', { name: 'Try again' }).click()

    // await fuelWalletTestHelper.walletApprove();
    // await page.getByRole('button', { name: 'View transaction' }).click()

    // should be able to create volatile pool (ETH/FUEL)
    await actor.attemptsTo(
      Navigate.to("/liquidity"),
      CreatePool.ofType("Volatile").withAssets(TOKENS.Base, TOKENS.Quote)
    );

    // should be able to create stable pool (ETH/FUEL)
    await actor.attemptsTo(
      Navigate.to("/liquidity"),
      CreatePool.ofType("Stable").withAssets(TOKENS.Base, TOKENS.Quote)
    );

    // should be able to add liquidity to existing pool (FUEL/ETH)
    await actor.attemptsTo(
      Navigate.to("/liquidity"),
      Wait.upTo(Duration.ofSeconds(10)).until(
        PageElement.located(By.css("Loading pools...")),
        not(isVisible())
      ),
      Wait.until(addLiquidityButton(), isPresent()),
      Scroll.to(addLiquidityButton()),
      Wait.upTo(Duration.ofSeconds(10)).until(
        addLiquidityButton(),
        isVisible()
      ),
      Click.on(addLiquidityButton())
      // https://github.com/user-attachments/assets/f72703fd-2c2b-4181-92e9-2ed7329e93c7
      // PageElement.located(By.cssContainingText(".ActionButton_btn__fm8nx", "Preview"))
      // Click.on(previewButton()),
      // https://github.com/user-attachments/assets/0ee2f99a-41d1-4083-b817-b987da2a9790
      // PageElement.located(By.cssContainingText(".ActionButton_btn__fm8nx.AddLiquiditySuccessModal_viewButton__yIkNM", "View Transaction"))
      // Click.on(viewTransactionButton()),
    );
  });
  it("should reach v2 bin liquidity preview in Create Pool flow", async ({
    fuelWalletTestHelper,
    actor,
    page,
  }) => {
    await page.goto("/");
    await page.bringToFront();

    await page.getByRole("button", {name: "Connect Wallet"}).click();
    await page.getByLabel("Connect to Fuel Wallet").click();
    await fuelWalletTestHelper.walletConnect();
    await page.getByRole("button", {name: "Sign and Confirm"}).click();

    await actor.attemptsTo(
      Navigate.to("/liquidity"),
      Wait.upTo(Duration.ofSeconds(10)).until(
        PageElement.located(By.css("Loading pools...")),
        not(isVisible())
      ),
      Wait.upTo(Duration.ofSeconds(10)).until(createPoolButton(), isVisible()),
      Click.on(createPoolButton()),
      // select the Concentrated (v2) pool type block FIRST
      Wait.until(concentratedPoolV2Option(), isVisible()),
      Click.on(concentratedPoolV2Option()),
      // then choose first asset
      Wait.until(chooseAssetButtons().first(), isVisible()),
      Click.on(chooseAssetButtons().first()),
      Wait.until(searchInput(), isVisible())
    );

    // select the Concentrated (v2) pool type block
    // type ETH slowly to avoid empty results, then select first result
    await actor.attemptsTo(
      Enter.theValue("").into(searchInput()),
      Press.the("E"),
      Wait.for(Duration.ofMilliseconds(50)),
      Press.the("T"),
      Wait.for(Duration.ofMilliseconds(50)),
      Press.the("H"),
      Wait.for(Duration.ofMilliseconds(50)),
      Press.the("Enter"),
      Wait.until(searchResults().first(), isVisible()),
      Click.on(searchResults().first())
    );

    // choose second asset
    await actor.attemptsTo(
      Click.on(chooseAssetButtons().last()),
      Wait.until(searchInput(), isVisible()),
      Enter.theValue("").into(searchInput()),
      Press.the("F"),
      Wait.for(Duration.ofMilliseconds(50)),
      Press.the("U"),
      Wait.for(Duration.ofMilliseconds(50)),
      Press.the("E"),
      Wait.for(Duration.ofMilliseconds(50)),
      Press.the("L"),
      Wait.for(Duration.ofMilliseconds(50)),
      Press.the("Enter"),
      Wait.until(searchResults().first(), isVisible()),
      Click.on(searchResults().first())
    );

    // Verify preview-step UI is present on the form for v2
    await actor.attemptsTo(
      Wait.until(previewSelectBinStepLabel(), isVisible()),
      Wait.until(previewEnterActivePriceLabel(), isVisible()),
      Wait.until(previewCreationButton(), isPresent())
    );

    // Fill deposit amounts and parameters
    await page.locator("[data-test-id='deposit-input-A']").fill("0.00001"); // ETH
    await page.locator("[data-test-id='deposit-input-B']").fill("1"); // FUEL

    // Select the second bin step from a button group if present
    const binButtons = page.locator("[data-test-id='bin-step-group'] button");
    if (await binButtons.count()) {
      await binButtons.nth(1).click();
    }

    // Enter active price of 1
    // Prefer data-test-id if available; fallback to label selector
    const activePriceInput = page
      .locator("[data-test-id='active-price-input']")
      .or(page.locator("span:has-text('Enter active price') + div input"));
    await activePriceInput.fill("1");

    // Click Preview creation to open modal
    await page.getByRole("button", {name: "Preview creation"}).click();

    // Assert modal shows correct pair and amounts
    const modal = page.locator("[data-test-id='create-pool-preview-modal']");
    await modal.waitFor({state: "visible"});

    // Pair assertion: expect ETH / FUEL
    const pair = modal
      .locator("[data-test-id='preview-pair']")
      .or(modal.locator("text=ETH / FUEL"));
    await pair.first().waitFor({state: "visible"});

    // Amount assertions
    const amountA = modal
      .locator("[data-test-id='preview-amount-A']")
      .or(modal.locator("text=0.00001"));
    const amountB = modal
      .locator("[data-test-id='preview-amount-B']")
      .or(modal.locator("text=1"));
    await amountA.first().waitFor({state: "visible"});
    await amountB.first().waitFor({state: "visible"});
  });

  it("should show simulation component on Position View page", async ({
    fuelWalletTestHelper,
    actor,
    page,
  }) => {
    await page.goto("/");
    await page.bringToFront();

    await page.getByRole("button", {name: "Connect Wallet"}).click();
    await page.getByLabel("Connect to Fuel Wallet").click();
    await fuelWalletTestHelper.walletConnect();
    await page.getByRole("button", {name: "Sign and Confirm"}).click();

    // Note
    // Add position
    // click liquidity page
    // click manage position
    // For Now!!!
    // Navigate directly to a known v1 pool position route
    // Using ETH / USDC volatile example from coinsConfig BASE_ASSETS
    await actor.attemptsTo(
      Navigate.to(
        "/liquidity/position?pool=0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-false"
      ),
      // Wait for the position view to render and simulation container to show
      Wait.upTo(Duration.ofSeconds(15)).until(
        positionSimulationContainer(),
        isVisible()
      )
    );
  });

  it("should show alert on Remove Liquidity page for bin liquidity", async ({
    fuelWalletTestHelper,
    actor,
    page,
  }) => {
    await page.goto("/");
    await page.bringToFront();

    await page.getByRole("button", {name: "Connect Wallet"}).click();
    await page.getByLabel("Connect to Fuel Wallet").click();
    await fuelWalletTestHelper.walletConnect();
    await page.getByRole("button", {name: "Sign and Confirm"}).click();

    // Note
    // click liquidity page
    // click manage position
    // click remove postion
    // For Now!!!
    // Navigate directly to remove-liquidity for a known v1 pool (ETH / USDC volatile)
    await actor.attemptsTo(
      Navigate.to(
        "/liquidity/remove?pool=0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-false"
      ),
      Wait.upTo(Duration.ofSeconds(15)).until(
        removeLiquidityAlertTitle(),
        isVisible()
      ),
      Wait.upTo(Duration.ofSeconds(15)).until(
        removeBinLiquidityPriceSummary(),
        isVisible()
      )
    );
  });

  it("should show simulation on Add Bin Liquidity page (v2)", async ({
    fuelWalletTestHelper,
    actor,
    page,
  }) => {
    await page.goto("/");
    await page.bringToFront();

    await page.getByRole("button", {name: "Connect Wallet"}).click();
    await page.getByLabel("Connect to Fuel Wallet").click();
    await fuelWalletTestHelper.walletConnect();
    await page.getByRole("button", {name: "Sign and Confirm"}).click();

    // Navigate directly to v2 add liquidity route using ETH/USDC example
    await actor.attemptsTo(
      Navigate.to(
        "/liquidity/add/?pool=0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-false"
      ),
      // The v2 form shows simulation only when at least one amount > 0 is provided.
      // We just assert that the simulation section header renders; chart may require amounts.
      Wait.upTo(Duration.ofSeconds(15)).until(
        addV2SimulationHeader(),
        isVisible()
      )
    );
  });

  it("should add bin liquidity: deposit A/B, adjust range, toggle disabled states, simulation visible", async ({
    fuelWalletTestHelper,
    actor,
    page,
  }) => {
    await page.goto("/");
    await page.bringToFront();

    await page.getByRole("button", {name: "Connect Wallet"}).click();
    await page.getByLabel("Connect to Fuel Wallet").click();
    await fuelWalletTestHelper.walletConnect();
    await page.getByRole("button", {name: "Sign and Confirm"}).click();

    await actor.attemptsTo(
      Navigate.to(
        "/liquidity/add/?pool=0x286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-false"
      )
    );

    // Fill deposit amounts for asset A and B
    const inputs = page.locator("input[placeholder='0']");
    await inputs.nth(0).fill("1.23");
    await inputs.nth(1).fill("4.56");

    // Type an out-of-range MIN to disable first input (current price below range)
    await page
      .locator("label:has-text('Min price') + div input")
      .fill("999999");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    const firstDisabled = await inputs.nth(0).isDisabled();
    if (!firstDisabled)
      throw new Error(
        "Expected first deposit input to be disabled when price is below range"
      );

    // Reset price to restore inputs
    await actor.attemptsTo(
      Wait.until(addV2ResetPriceButton(), isVisible()),
      Click.on(addV2ResetPriceButton())
    );
    await page.waitForTimeout(300);

    // Type an out-of-range MAX to disable second input (current price above range)
    await page
      .locator("label:has-text('Max price') + div input")
      .fill("0.000001");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    const secondDisabled = await inputs.nth(1).isDisabled();
    if (!secondDisabled)
      throw new Error(
        "Expected second deposit input to be disabled when price is above range"
      );

    // Ensure simulation header is visible when deposit amounts are present
    await actor.attemptsTo(Wait.until(addV2SimulationHeader(), isVisible()));
  });
});

describe("Swap", () => {
  beforeEach(async ({actor}) => {
    await actor.attemptsTo(Navigate.to("/"));
  });

  ["0.1", "0.5"].forEach((value) => {
    it(`should be able to adjust slippage to ${value}%`, async ({actor}) => {
      await actor.attemptsTo(AdjustSlippage.to(value));
    });
  });

  it("should be able to adjust custom slippage", async ({actor}) => {
    await actor.attemptsTo(AdjustSlippage.toCustom("0.7"));
  });

  it("should be able to sell ETH for FUEL", async ({actor}) => {
    await actor.attemptsTo(Swap.sell("2", TOKENS.Base), Swap.buy(TOKENS.Quote));
  });

  it("should be able to swap buy and sell currencies", async ({actor}) => {
    await actor.attemptsTo(Swap.sell("2", TOKENS.Base), Swap.convert());
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
        isVisible()
      ),
      Click.on(
        PageElement.located(By.cssContainingText("button", "Learn More "))
      )
    );
  });

  it("should be able to manage positions in liquidity pools", async ({
    actor,
  }) => {
    await actor.attemptsTo(
      Wait.upTo(Duration.ofSeconds(10)).until(
        PageElement.located(By.css("Loading pools...")),
        not(isVisible())
      )
      // https://github.com/user-attachments/assets/a8391ae1-46e3-4466-8981-17f604f39f44
      // PageElement.located(By.css(".ActionButton_btn__fm8nx.ActionButton_secondary__gLMKU.DesktopPosition_addButton__JkbHU"))
      // Wait.until(managePositionButton(), isVisible())
      // https://github.com/user-attachments/assets/d2731ef8-45a5-4a6c-86fd-d4c0c0e847df
      // PageElement.located(By.cssContainingText(".ActionButton_btn__fm8nx.PositionView_withdrawButton__Qzi_l", "Remove Liquidity"))
      // Click.on(removeLiquidityButton()),
      // https://github.com/user-attachments/assets/e4a63046-f761-4609-8b4b-eb479baec6c4
      // PageElement.located(By.cssContainingText(".ActionButton_btn__fm8nx.AddLiquiditySuccessModal_viewButton__yIkNM", "View Transaction"))
      // Click.on(viewTransactionButton()),
    );
  });
});

describe("Points", () => {
  it("should be able to see leaderboard", async ({actor}) =>
    actor.attemptsTo(
      Navigate.to("/points"),
      Wait.upTo(Duration.ofSeconds(10)).until(
        PageElement.located(By.css("Loading points leaderboard...")),
        not(isVisible())
      )
    ));
});

describe("Navigation", () => {
  it("should see swap module at '/'", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/landing"),
      Wait.until(swapModule(), isPresent())
    );
  });

  it("should see landing page at '/landing'", async ({actor}) =>
    actor.attemptsTo(
      Navigate.to("/landing"),
      Wait.until(
        PageElement.located(
          By.cssContainingText("h1", "The Liquidity Hub on Fuel")
        ),
        isVisible()
      )
    ));

  it("should see swap module at '/landing'", async ({actor}) => {
    await actor.attemptsTo(
      Navigate.to("/landing"),
      Wait.until(swapModule(), isPresent())
    );
  });
});

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

describe("Layout", () => {
  beforeEach(async ({actor}) => {
    await actor.attemptsTo(Navigate.to("/"));
  });

  describe("Header", () => {
    it("should show section", async ({actor}) =>
      actor.attemptsTo(Layout.shouldShow("header", header())));

    it("should show logo", async ({actor}) =>
      actor.attemptsTo(Layout.shouldShow("logo", headerLogo())));

    it("should show 'Swap' link", async ({actor}) =>
      actor.attemptsTo(Layout.shouldShow("'Swap' link", headerSwapLink())));

    it("should show 'Liquidity' link", async ({actor}) =>
      actor.attemptsTo(
        Layout.shouldShow("'Liquidity' link", headerLiquidityLink())
      ));

    it("should show 'Bridge' link", async ({actor}) =>
      actor.attemptsTo(Layout.shouldShow("'Bridge' link", headerBridgeLink())));

    !process.env.NEXT_PUBLIC_ENABLE_REBRAND_UI &&
      it("should show 'Mainnet' text", async ({actor}) =>
        actor.attemptsTo(
          Layout.shouldShow("'Mainnet' text", headerMainnetText())
        ));

    it("should show 'Connect Wallet' button", async ({actor}) =>
      actor.attemptsTo(
        Layout.shouldShow(
          "'Connect Wallet' button",
          headerConnectWalletButton()
        )
      ));
  });

  describe("Footer", () => {
    it("should show section", async ({actor}) =>
      actor.attemptsTo(Layout.shouldBePresent("footer", footer())));

    it("should show footer logo", async ({actor}) =>
      actor.attemptsTo(Layout.shouldBePresent("footer logo", footerLogo())));

    it("should show 'Support' link", async ({actor}) =>
      actor.attemptsTo(
        Layout.shouldBePresent("Support link", footerSupportLink())
      ));

    it("should show 'Security Audit' link", async ({actor}) =>
      actor.attemptsTo(
        Layout.shouldBePresent("Security Audit link", footerSecurityAuditLink())
      ));

    it("should show 'Docs' link", async ({actor}) =>
      actor.attemptsTo(Layout.shouldBePresent("Docs link", footerDocsLink())));

    it("should show 'Blog' link", async ({actor}) =>
      actor.attemptsTo(Layout.shouldBePresent("Blog link", footerBlogLink())));

    it("should show 'Contact us' link", async ({actor}) =>
      actor.attemptsTo(
        Layout.shouldBePresent("Contact us link", footerContactUsLink())
      ));
  });
});

describe.skip("API Endpoints", () => {
  //   beforeEach(async ({actor}) => {
  //     await actor.attemptsTo(
  //       Navigate.to("/"),
  // );
  //   });

  it("asset", async ({actor}) =>
    actor.attemptsTo(
      Send.a(GetRequest.to("/api/asset?id=123456")),
      Ensure.that(LastResponse.status(), equals(200)),
      Ensure.that(LastResponse.body(), isPresent())
    ));

  it("campaigns", async ({actor}) =>
    actor.attemptsTo(
      Send.a(GetRequest.to("/api/campaigns")),
      Ensure.that(LastResponse.status(), equals(200)),
      Ensure.that(LastResponse.body(), isPresent())
    ));

  it("events", async ({actor}) =>
    actor.attemptsTo(
      Send.a(GetRequest.to("/api/events?fromBlock=100&toBlock=200")),
      Ensure.that(LastResponse.status(), equals(200)),
      Ensure.that(LastResponse.body(), isPresent())
    ));

  it("latest-block", async ({actor}) =>
    actor.attemptsTo(
      Send.a(GetRequest.to("/api/latest-block")),
      Ensure.that(LastResponse.status(), equals(200)),
      Ensure.that(LastResponse.body(), isPresent())
    ));

  it("pair", async ({actor}) =>
    actor.attemptsTo(
      Send.a(GetRequest.to("/api/pair?id=pool1")),
      Ensure.that(LastResponse.status(), equals(200)),
      Ensure.that(LastResponse.body(), isPresent())
    ));

  it("points", async ({actor}) =>
    actor.attemptsTo(
      Send.a(GetRequest.to("/api/points")),
      Ensure.that(LastResponse.status(), equals(200)),
      Ensure.that(LastResponse.body(), isPresent())
    ));

  it("rewards", async ({actor}) =>
    actor.attemptsTo(
      Send.a(
        GetRequest.to(
          "/api/rewards?poolIds=286c479da40dc953bddc3bb4c453b608bba2e0ac483b077bd475174115395e6b-f8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07-false&epochNumbers=1&userId=0x69e6223f2adf576dfefb21873b78e31ba228b094d05f74f59ea60cbd1bf87d0d"
        )
      ),
      Ensure.that(LastResponse.status(), equals(200)),
      Ensure.that(LastResponse.body(), isPresent())
    ));
});
