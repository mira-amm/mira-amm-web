{ pkgs ? import <nixpkgs> {}, arg ? "" }:

let
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
    pkgs.uv
    pkgs.shellspec
    pkgs.fastfetch
    pkgs.figlet
    pkgs.lolcat
    pkgs.ansi
    pkgs.ncurses
  ];

  shellHook = ''
    export TERM=xterm-256color

    doctor() {
    shellspec --format documentation
    }

    case "${arg}" in
      doctor)
        doctor
        exit 0
        ;;
    esac

    uv tool install --python 3.12 posting

    zellij --config zellij.config.kdl -n zellij.layout.kdl

    ascii-image-converter ${miraLogoPath} --color -f -b

    zellij da -y

    echo "🚪 Exiting Nix shell..."
    exit
  '';
}
