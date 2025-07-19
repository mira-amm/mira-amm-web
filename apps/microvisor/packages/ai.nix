# TODO: check out community.flake.parts/services-flake/llm
{
  pkgs,
  inputs,
  ...
}:

{
  overlays = [
    (final: prev: {
      open-webui =
        (import inputs.nixpkgs-unstable {
          system = prev.stdenv.system;
          config = {
            allowUnfree = true;
            allowBroken = true;
          };
        }).open-webui;
    })
  ];
  packages = with pkgs; [
    tgpt
    # github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/by-name/op/open-webui/package.nix
    open-webui
  ];
}
