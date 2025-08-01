{
  cachix = {
    enable = true;
    pull = [
      "fuellabs"      # fuellabs.cachix.org-1:3gOmll82VDbT7EggylzOVJ6dr0jgPVU/KMN6+Kf8qx8=
      "pre-commit-hooks"
      # "rad"
      "oxalica"       # oxalica.cachix.org-1:h0iRBw6tQD8+51ZvnNEBPbwLR58UD7klauDBWzBdugQ=
      "nixpkgs"       # nixpkgs.cachix.org-1:q91R6hxbwFvDqTSDKwDAV4T5PxqXGxswD8vhONFMeOE=
      "nix-community" # nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs=
    ];
  };
}

# nix profile install github:fuellabs/fuel.nix#fuel
# cachix use fuellabs
# fuel-labs:
#   url: github:fuellabs/fuel.nix
#   or
#   url: github:fuellabs/fuel.nix#fuel-nightly
# nix profile list
