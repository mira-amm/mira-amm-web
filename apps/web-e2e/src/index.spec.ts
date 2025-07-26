import {chromium, type BrowserContext} from "@playwright/test";
import {
  downloadFuel,
  seedWallet,
  FuelWalletTestHelper,
} from "@fuels/playwright-utils";

import {Duration, Wait, Cast} from "@serenity-js/core";

import {Navigate, PageElement, By, Click, isVisible} from "@serenity-js/web";

import {
  Ensure,
  property,
  equals,
  and,
  startsWith,
  isPresent,
  not,
} from "@serenity-js/assertions";

import {BrowseTheWebWithPlaywright} from "@serenity-js/playwright";

import {
  useFixtures,
  describe,
  it,
  beforeEach,
  afterEach,
  test,
} from "@serenity-js/playwright-test";

import {
  CallAnApi,
  DeleteRequest,
  GetRequest,
  LastResponse,
  PostRequest,
  Send,
} from "@serenity-js/rest";

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
  footerSecurityAuditLink,
  footerDocsLink,
  footerBlogLink,
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

type TestScopeFixtures = {
  context: BrowserContext;
  extensionId: string;
  actors: Cast;
};

// const wallet = new FuelWalletTestHelper()
// const pathToExtension = await downloadFuel('0.55.2');
// const context = await chromium.launchPersistentContext('', {
//   channel: 'chromium',
//   // headless: false,
//   // args: [
//   //   `--disable-extensions-except=${pathToExtension}`,
//   //   `--load-extension=${pathToExtension}`,
//   // ],
// });
// const FUEL_MNEMONIC = "demand fashion unaware upgrade upon heart bright august panel kangaroo want gaze";
// const FUEL_WALLET_PASSWORD = "$123Ran123Dom123!";
// static async walletSetup(
//     context: BrowserContext,
//     fuelExtensionId: string,
//     fuelProviderUrl: "https://mainnet.fuel.network/v1/graphql",
//     chainName: string,
//     mnemonic: string = FUEL_MNEMONIC,
//     password: string = FUEL_WALLET_PASSWORD
// ): Promise<FuelWalletTestHelper>

// export const { describe, it, beforeEach, afterEach, test } = useFixtures<TestScopeFixtures>({
//   // context: async ({}, use) => {
//   //   const pathToExtension = await downloadFuel('0.55.2');

//   //   const context = await chromium.launchPersistentContext('', {
//   //     channel: 'chromium',
//   //     // headless: false,
//   //     args: [
//   //       `--disable-extensions-except=${pathToExtension}`,
//   //       `--load-extension=${pathToExtension}`,
//   //     ],
//   //   });
//   //   await use(context);
//   //   await context.close();
//   // },

//   actors: async ({browser}, use) => {
//     const cast = Cast.where(actor =>
//       actor.whoCan(BrowseTheWebWithPlaywright.using(browser, {
//         ...context,
//         userAgent: actor.name,
//         extensionId: async ({ context }, use) => {
//           let [background] = context.serviceWorkers();
//           if (!background) background = await context.waitForEvent('serviceworker');
//           const extensionId = background.url().split('/')[2];
//           await use(extensionId);
//         },
//       }))
//     );

//     // let [background] = context.serviceWorkers();
//     // if (!background) background = await context.waitForEvent('serviceworker');

//     // const extensionId = background.url().split('/')[2];

//     // await use(context);
//     // await use(extensionId);
//     await use(cast);
//     // await context.close();
//   },
// });

describe("Connect to wallet", () => {
  it("should be able to connect to fuel wallet", async ({
    actor,
    context,
  }, use) => {
    await actor.attemptsTo(
      Navigate.to("/"),
      Wait.until(connectWalletButton(), isVisible()),
      Click.on(connectWalletButton()),
      Wait.until(
        PageElement.located(
          By.cssContainingText(
            "div.fuel-connectors-connector-item",
            "Fuel Wallet"
          )
        ),
        isVisible()
      ),
      Click.on(
        PageElement.located(
          By.cssContainingText(
            "div.fuel-connectors-connector-item",
            "Fuel Wallet"
          )
        )
      ),
      Wait.until(
        PageElement.located(By.cssContainingText("a", "Install")),
        isVisible()
      ),
      Click.on(PageElement.located(By.cssContainingText("a", "Install")))
    );
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

  it("should be able to create volatile pool (ETH/FUEL)", async ({actor}) => {
    await actor.attemptsTo(
      CreatePool.ofType("Volatile").withAssets(TOKENS.Base, TOKENS.Quote)
    );
  });

  it("should be able to create stable pool (ETH/FUEL)", async ({actor}) => {
    await actor.attemptsTo(
      CreatePool.ofType("Stable").withAssets(TOKENS.Base, TOKENS.Quote)
    );
  });

  it("should be able to add liquidity to existing pool (FUEL/ETH)", async ({
    actor,
  }) => {
    await actor.attemptsTo(
      Wait.upTo(Duration.ofSeconds(10)).until(
        PageElement.located(By.css("Loading pools...")),
        not(isVisible())
      ),
      Wait.until(addLiquidityButton(), isPresent()),
      Click.on(addLiquidityButton()),
      Wait.until(connectWalletButton(), isVisible())
      // https://github.com/user-attachments/assets/f72703fd-2c2b-4181-92e9-2ed7329e93c7
      // PageElement.located(By.cssContainingText(".ActionButton_btn__fm8nx", "Preview"))
      // Click.on(previewButton()),
      // https://github.com/user-attachments/assets/0ee2f99a-41d1-4083-b817-b987da2a9790
      // PageElement.located(By.cssContainingText(".ActionButton_btn__fm8nx.AddLiquiditySuccessModal_viewButton__yIkNM", "View Transaction"))
      // Click.on(viewTransactionButton()),
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
