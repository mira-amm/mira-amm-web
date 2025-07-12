{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  name = "microdoctor";

  packages = [
    # ============= 🧪‍🔬‍ ================
      pkgs.shellspec
  ];
}
