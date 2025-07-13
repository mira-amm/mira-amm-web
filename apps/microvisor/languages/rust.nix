{
  languages = {
    rust = {
      enable = true;
      channel = "stable";
      targets = [ "wasm32-unknown-unknown" ];
      components = [ "rustc" "cargo" "clippy" "rustfmt" "rust-analyzer"];
    };
  };
}
