{
  config,
  ...
}:

{
  scripts = {
    hello = {
      description = "  👋 Show the Devenv logo art and a friendly greeting";
      exec        = ''
        chafa --align center ${config.env.DEVENV_ROOT}/libs/shared/assets/devenv-symbol-dark-bg.png
        chafa --align center ${config.env.DEVENV_ROOT}/libs/shared/assets/charthouse-labs-banner.png
        echo "👋🧩"
      '';
    };
  };
}
