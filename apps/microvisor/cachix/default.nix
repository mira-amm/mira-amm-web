{
  cachix = {
    enable = true;
    pull = [
      "fuellabs"
      "pre-commit-hooks"
      # "rad"
      "oxalica"
      "nixpkgs"
      "nix-community"
      "devenv"
      "nix-darwin"
      "mfarabi"
      "cachix"
      "emacs-ci"
    ];
    push = "charthouse-labs";
  };
}

# nix profile install github:fuellabs/fuel.nix#fuel
# cachix use fuellabs
# fuel-labs:
#   url: github:fuellabs/fuel.nix
#   or
#   url: github:fuellabs/fuel.nix#fuel-nightly
# nix profile list
