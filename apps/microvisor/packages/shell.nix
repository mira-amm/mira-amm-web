{ pkgs, ... }:

{
  packages = with pkgs; [
    btop
    chafa
    eza
    fastfetch
    figlet
    pik
    ttyd
    yazi
    zellij
    zsh
  ];
}
