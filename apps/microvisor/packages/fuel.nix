{
  pkgs,
  inputs,
  ...
}:

let
  forc-wallet = inputs.fuel-labs.packages.${pkgs.system}.forc-wallet;
in
{
  packages = [
    forc-wallet
  ];
}
