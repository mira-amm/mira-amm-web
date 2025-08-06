{ pkgs, ... }:

{
  packages = with pkgs; [
    supabase-cli
    lazysql
    lazydocker
  ];
}
