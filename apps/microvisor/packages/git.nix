{pkgs, ...}:

{
  packages = with pkgs; [
    git
    lazygit
  ];
}
