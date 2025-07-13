# TODO: check out community.flake.parts/services-flake/llm
{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  overlays = [
    (final: prev: {
      open-webui = (import inputs.nixpkgs-unstable {
        system = prev.stdenv.system;
        config.allowUnfree = true;
      }).open-webui;
    })
  ];
  packages = with pkgs; [
    tgpt
    # github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/by-name/op/open-webui/package.nix
    open-webui
  ];
}
