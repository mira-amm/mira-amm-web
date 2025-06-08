console.log("Microvisor extension background script loaded");
console.log(browser.runtime.id)

// github.com/wxt-dev/wxt/blob/main/packages/browser/src/gen/index.d.ts
export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason !== "install") return;

    await browser.tabs.create({
      url: "http://localhost:7681/?fontFamily=JetBrainsMono%20Nerd%20Font&fontSize=20&enableSixel=true&enableTrzsz=true&fontSize=18&disableLeaveAlert=false&titleFixed=💻%20Microvisor",
      active: true,
      index: 0,
    });

    await browser.tabs.create({
      url: "http://localhost:3000",
      active: false,
      index: 1,
    });

    await browser.tabs.create({
      url: "http://localhost:8000",
      active: false,
      index: 2,
    });

    await browser.tabs.create({
      url: "http://localhost:8080",
      active: false,
      index: 3,
    });

    await browser.tabs.create({
      url: "http://localhost:4000",
      active: false,
      index: 4,
    });

    const tabs = await browser.tabs.query({currentWindow: true})

    const tabIds = tabs.map(({ id }) => id);

    const group = await browser.tabs.group({tabIds});

    browser.tabGroups.update(group, {
      title: '🦕 APPS',
      color: 'green',
    });

    await browser.fontSettings.setFont({
      genericFamily: 'sansserif',
      script: 'Zyyy',
      fontId: 'JetBrainsMono Nerd Font',
    });

    await browser.fontSettings.setFont({
      genericFamily: 'serif',
      script: 'Zyyy',
      fontId: 'JetBrainsMono Nerd Font'
    });

    await browser.fontSettings.setFont({
      genericFamily: 'standard',
      script: 'Zyyy',
      fontId: 'JetBrainsMono Nerd Font'
    });

    await browser.fontSettings.setMinimumFontSize({
      pixelSize: 18,
    });

    // TODO: feat(microvisor): create get started page
    // await browser.tabs.create({
      // url: browser.runtime.getURL("/get-started.html"),
    // });
  });
});
