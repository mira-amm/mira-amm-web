{pkgs, ...}:

{
  packages = with pkgs; [
    eza
    posting
    yazi
    ttyd
    zellij
    btop
    figlet
    chafa
  ];
}
