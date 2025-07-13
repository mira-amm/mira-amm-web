{ pkgs, lib, ... }:

{
  imports = [
    ./ai.nix
    ./db.nix
    ./git.nix
    ./shell.nix
  ];

  packages = with pkgs; [
    curl
    wget
    pulumi
    pulumi-esc
  ] ++ lib.optionals (stdenv.isLinux) [
    vips
  ] ++ lib.optionals (stdenv.isDarwin && stdenv.isAarch64) [
    cowsay
  ];
}
