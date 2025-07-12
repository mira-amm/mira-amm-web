{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  name = "db";

  packages = [
    # ============= 📀‍ ================
      pkgs.supabase-cli
  ];
}
