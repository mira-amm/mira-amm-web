{ pkgs ? import <nixpkgs> {} }:

let
  pkgs-unstable = import (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/refs/heads/nixpkgs-unstable.tar.gz";
  }) {};

  logoPath = "../libs/shared/assets/charthouse-labs-symbol.png";
  miraLogoPath = "../libs/shared/assets/mira-wordmark-long-light.png";

in pkgs.mkShell {
  name = "mira-dev-env";

  buildInputs = [
    pkgs.zellij
    pkgs.nerd-fonts.jetbrains-mono
    pkgs.ascii-image-converter
    pkgs.lazygit
    pkgs.btop
    pkgs.yazi
    pkgs.tgpt
    pkgs-unstable.posting
  ];

  shellHook = ''
zellij --config zellij.config.kdl -n zellij.layout.kdl

ascii-image-converter ${miraLogoPath} --color -f -b

zellij da -y
echo "🚪 Exiting Nix shell..."
exit

# trap 'echo "🚪 Exiting Nix shell..."; zellij da;' EXIT
 '';
}
