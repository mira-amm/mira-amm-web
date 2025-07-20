{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

let
  pkgs-playwright = import inputs.nixpkgs-unstable-playwright { system = pkgs.stdenv.system; };
  browsers = (builtins.fromJSON (builtins.readFile "${pkgs-playwright.playwright-driver}/browsers.json")).browsers;
  chromium-rev = (builtins.head (builtins.filter (x: x.name == "chromium-headless-shell") browsers)).revision;
in
{
  env = {
    #====================================================
    #            🎭 PLAYWRIGHT NIX-FOO 🎭
    #====================================================
    PLAYWRIGHT_BROWSERS_PATH = "${pkgs-playwright.playwright.browsers}";
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = true;
    PLAYWRIGHT_NODEJS_PATH = "${pkgs.nodejs_22}/bin/node";
    # PLAYWRIGHT_LAUNCH_OPTIONS_EXECUTABLE_PATH = "${pkgs-playwright.playwright.browsers}/chromium-${chromium-rev}/chrome-linux/chrome";

    DATA_DIR = "./.open-webui";
  };
}
