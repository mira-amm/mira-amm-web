{ pkgs, ... }:

{
  languages = {
    javascript = {
      enable = true;
      package = pkgs.nodejs_22;
      # bun = {
      #   enable = true;
      #   install.enable = true;
      # };
      pnpm = {
        enable = true;
        # install.enable = true;
      };
    };
  };
}
