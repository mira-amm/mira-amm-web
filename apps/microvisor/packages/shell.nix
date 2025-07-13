{pkgs, ...}:

{
  packages = with pkgs; [
    zsh
    eza
    yazi
    ttyd
    zellij
    btop
    figlet
    chafa
  ];
}
