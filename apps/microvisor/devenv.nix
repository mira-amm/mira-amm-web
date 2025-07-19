{
  name = "🧮 microvisor 🧮";

  imports = [
    ./env
    ./languages
    ./packages
    ./processes
    ./scripts
    ./services
    ./tasks
  ];

  # NOTE: uses native nixos test syntax | nixos.org/manual/nixos/stable/#sec-writing-nixos-tests
  enterTest = ''
    set -ex
    # process-compose down
  '';

  enterShell = ''
    alias l='eza -alh  --icons=auto' # long list
    alias ls='eza -a -1   --icons=auto' # short list
    alias ll='eza -lha --icons=auto --sort=name --group-directories-first' # long list all
    alias ld='eza -lhD --icons=auto' # long list dirs
    alias lt='eza --icons=auto --tree' # list folder as tree
    alias cat='bat'
    alias mkdir='mkdir -p'

    devenv info
    hello
  '';

  starship = {
    enable = false;
    config = {
      enable = false;
      path = ./starship.toml;
    };
  };
}
