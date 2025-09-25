import {
  FUEL_MNEMONIC,
  FUEL_WALLET_PASSWORD,
  getButtonByText,
  getByAriaLabel,
  expectButtonToBeEnabled,
  hasText,
} from "@fuels/playwright-utils";
import {
  expect,
  type BrowserContext,
  type Locator,
  type Page,
} from "@playwright/test";

export class FuelWalletTestHelper {
  private context;
  private walletPage;

  private constructor(context: BrowserContext) {
    this.context = context;
    const walletPage = this.context.pages().find((page) => {
      const url = page.url();
      return url.includes("/popup.html#/wallet");
    });

    if (!walletPage) {
      throw new Error("Wallet Page could not be found");
    }

    this.walletPage = walletPage;
  }

  static async walletSetup({
    context,
    fuelExtensionId,
    fuelProvider,
    chainName,
    mnemonic = FUEL_MNEMONIC,
    password = FUEL_WALLET_PASSWORD,
  }: {
    context: BrowserContext;
    fuelExtensionId: string;
    fuelProvider: {
      url: string;
      chainId: number;
    };
    chainName: string;
    mnemonic: string;
    password?: string;
  }) {
    // Wait for the signup page to appear
    let signupPage;
    for (let i = 0; i < 30; i++) {
      signupPage = context.pages().find((page) => {
        const url = page.url();
        return url.includes("sign-up");
      });
      if (signupPage) break;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (!signupPage) {
      throw new Error("Signup page did not appear after 30 seconds");
    }

    await signupPage.bringToFront();
    expect(signupPage.url()).toContain("sign-up");
    const createNewWalletButton = signupPage.getByRole("heading", {
      name: "Create new wallet",
    });

    await createNewWalletButton.click();

    await signupPage.getByRole("checkbox").click();
    const toSeedPhrase = getButtonByText(signupPage, "Next: Seed Phrase");
    await toSeedPhrase.click();

    await signupPage.getByRole("checkbox", {name: "Confirm Saved"}).click();

    await signupPage.locator("button").getByText("Copy").click();

    await signupPage
      .locator("button")
      .getByText("Next: Confirm Phrase")
      .click();

    await signupPage.locator("button").getByText("Paste").click();
    await signupPage.getByRole("button", {name: "Next: Your password"}).click();

    const enterPassword = getByAriaLabel(signupPage, "Your Password");
    await enterPassword.fill(password);
    const confirmPassword = getByAriaLabel(signupPage, "Confirm Password");
    await confirmPassword.fill(password);
    const toFinish = getButtonByText(signupPage, "Next: Finish setup");
    await toFinish.click();

    await signupPage
      .locator("h2")
      .getByText("Wallet created successfully")
      .waitFor({state: "visible", timeout: 9000});

    await signupPage.goto(
      `chrome-extension://${fuelExtensionId}/popup.html#/wallet`
    );

    const fuelWalletTestHelper = new FuelWalletTestHelper(context);

    const accountsButton = getByAriaLabel(
      fuelWalletTestHelper.walletPage,
      "Accounts"
    );
    await accountsButton.click();
    const addAccountButton = getByAriaLabel(
      fuelWalletTestHelper.walletPage,
      "Import from private key"
    );
    await addAccountButton.click();
    const importAccountInput = getByAriaLabel(
      fuelWalletTestHelper.walletPage,
      "Private Key"
    );
    await importAccountInput.fill(process.env.FUEL_WALLET_PRIVATE_KEY);
    const accountNameInput = getByAriaLabel(
      fuelWalletTestHelper.walletPage,
      "Account Name"
    );
    await accountNameInput.fill("Derek the Dino");
    const importButton = getButtonByText(
      fuelWalletTestHelper.walletPage,
      "Import"
    );
    await importButton.click();

    return fuelWalletTestHelper;
  }

  async walletConnect(accountNames?: string[], connectCurrentAccount = true) {
    const walletNotificationPage = await this.getWalletPopupPage();

    if (!connectCurrentAccount) {
      const disconnectCurrentAccountButton = walletNotificationPage.getByRole(
        "switch",
        {checked: true}
      );
      await disconnectCurrentAccountButton.click();
    }

    if (accountNames) {
      for (const accountName of accountNames) {
        const accountConnectionButton = getByAriaLabel(
          walletNotificationPage,
          `Toggle ${accountName}`
        );
        await accountConnectionButton.click();
      }
    }

    const nextButton = getButtonByText(walletNotificationPage, "Next");
    await nextButton.click();
    const connectButton = getButtonByText(walletNotificationPage, "Connect");
    await connectButton.click();
  }

  async walletApprove() {
    const walletPage = await this.getWalletPopupPage();
    await getButtonByText(walletPage, "Submit").click();
  }

  async walletReject() {
    const walletPage = await this.getWalletPopupPage();
    await getButtonByText(walletPage, "Reject").click();
  }

  async getWalletPopupPage(): Promise<Page> {
    console.log(
      "🔍 Searching for existing wallet popup page in",
      this.context.pages().map((page) => page.url())
    );
    console.log(`Timestamp: ${Date.now()}`);
    let walletNotificationPage = this.context.pages().find((page) => {
      const url = page.url();
      return url.includes("/popup.html?");
    });

    if (!walletNotificationPage) {
      console.log("⏳ No existing popup found, waiting for popup event...");
      walletNotificationPage = await this.context.waitForEvent("page", {
        predicate: (page) => page.url().includes("/popup"),
        timeout: 30000,
      });
      console.log(
        "🔍 Searching for existing wallet popup page in",
        this.context.pages().map((page) => page.url())
      );
      console.log(`Timestamp: ${Date.now()}`);
      // If the popup is not found, try to find it in the pages again
      if (!walletNotificationPage) {
        walletNotificationPage = this.context.pages().find((page) => {
          const url = page.url();
          return url.includes("/popup.html?");
        });
      }
    }
    if (!walletNotificationPage) {
      console.log(
        "🔍 No popup found in",
        this.context.pages().map((page) => page.url())
      );
      throw new Error("No popup found");
    }
    console.log(
      "🔍 Returning popup page with URL:",
      walletNotificationPage?.url()
    );

    return walletNotificationPage;
  }

  async addAssetThroughSettings(
    assetId: string,
    name: string,
    symbol: string,
    decimals: number,
    imageUrl?: string
  ) {
    const walletPage = this.getWalletPage();

    let menuButton: Locator;

    await expect
      .poll(
        async () => {
          menuButton = getByAriaLabel(walletPage, "Menu", true);
          return await menuButton.isVisible().catch(() => false);
        },
        {timeout: 5000}
      )
      .toBeTruthy();
    await walletPage.waitForTimeout(2000);
    await menuButton!.click();

    const settingsButton = walletPage
      .getByRole("menuitem")
      .getByText("Settings");
    await settingsButton.click();

    const assetsButton = walletPage.getByRole("menuitem").getByText("Assets");
    await assetsButton.click();

    const addAssetButton = getByAriaLabel(walletPage, "Add Asset");
    await addAssetButton.click();

    const assetIdInput = getByAriaLabel(walletPage, "Asset ID");
    await assetIdInput.fill(assetId);

    const assetNameInput = walletPage.getByLabel("Asset name");
    await assetNameInput.fill(name);
    const assetSymbolInput = walletPage.getByLabel("Asset symbol");
    await assetSymbolInput.fill(symbol);
    const assetDecimalsInput = walletPage.getByLabel("Asset decimals");
    await assetDecimalsInput.fill(decimals.toString());
    const assetImageUrlInput = walletPage.getByLabel("Asset image Url");
    await assetImageUrlInput.fill(imageUrl || "");

    const saveButton = getButtonByText(walletPage, "Save");
    await saveButton.click();
  }

  async addAssetFromHomeBalance(
    assetId: string,
    name: string,
    symbol: string,
    decimals: number,
    imageUrl?: string
  ) {
    const walletPage = this.getWalletPage();

    const showUnkownAssetsButton = getButtonByText(
      walletPage,
      "Show unknown assets"
    );
    await showUnkownAssetsButton.click();

    await walletPage
      .getByRole("article")
      .filter({hasText: shortAddress(assetId)})
      .locator("button")
      .getByText("(Add)")
      .click();

    const assetNameInput = walletPage.getByLabel("Asset name");
    await assetNameInput.fill(name);
    const assetSymbolInput = walletPage.getByLabel("Asset symbol");
    await assetSymbolInput.fill(symbol);
    const assetDecimalsInput = walletPage.getByLabel("Asset decimals");
    await assetDecimalsInput.fill(decimals.toString());
    const assetImageUrlInput = walletPage.getByLabel("Asset image Url");
    await assetImageUrlInput.fill(imageUrl || "");

    const saveButton = getButtonByText(walletPage, "Save");
    await saveButton.click();
  }

  async addAccount() {
    const accountsButton = getByAriaLabel(this.walletPage, "Accounts");
    await accountsButton.click();
    const addAccountButton = getByAriaLabel(this.walletPage, "Add account");
    await addAccountButton.click();
  }

  async switchAccount(accountName: string) {
    const accountsButton = getByAriaLabel(this.walletPage, "Accounts");
    await accountsButton.click();
    const accountButton = getByAriaLabel(this.walletPage, accountName, true);
    await accountButton.click();
  }

  async addNetwork({
    chainName,
    providerUrl,
    chainId,
  }: {
    chainName: string;
    providerUrl: string;
    chainId: number;
  }) {
    const networksButton = getByAriaLabel(this.walletPage, "Selected Network");
    await networksButton.click();

    const networkLocator = this.walletPage.getByText(chainName);
    const hasNetwork = (await networkLocator.count()) > 0;

    if (hasNetwork) {
      await networkLocator.click();
      return;
    }

    const addNetworkButton = getByAriaLabel(this.walletPage, "Add network");
    await addNetworkButton.click();

    const urlInput = getByAriaLabel(this.walletPage, "Network url");
    await urlInput.fill(providerUrl);
    const chainIdLocator = getByAriaLabel(this.walletPage, "Chain ID");
    await chainIdLocator.fill(chainId.toString());

    const testConnectionButton = getByAriaLabel(
      this.walletPage,
      "Test connection"
    );
    await expectButtonToBeEnabled(testConnectionButton);
    await testConnectionButton.click({
      delay: 1000,
    });
    await hasText(this.walletPage, `You're adding this network`);

    const addNewNetworkButton = getByAriaLabel(
      this.walletPage,
      "Add new network"
    );
    await expectButtonToBeEnabled(addNewNetworkButton);
    await addNewNetworkButton.click();
  }

  async switchNetwork(chainName: string) {
    const networksButton = getByAriaLabel(this.walletPage, "Selected Network");
    await networksButton.click();
    const networkButton = getByAriaLabel(this.walletPage, chainName, true);
    await networkButton.click();
  }

  getWalletPage() {
    return this.walletPage;
  }
}
