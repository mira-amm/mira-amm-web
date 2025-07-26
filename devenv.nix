{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  env = {
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = true;
    PLAYWRIGHT_NODEJS_PATH = "${pkgs.nodejs_22}/bin/node";
    DATA_DIR = "./.open-webui";
  };
}
