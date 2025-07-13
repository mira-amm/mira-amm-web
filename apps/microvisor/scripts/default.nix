{
  imports = [
    ./dev.nix
    ./doctor.nix
    ./hello.nix
    ./graph.nix
  ];

  scripts = {
    console = {
      description = "🕹 Fire up the Microvisor Console";
      exec        = ''
        ttyd --writable --browser --url-arg --once process-compose
      '';
    };

    kernel = {
      description = "🎉 Fire up the Microvisor Kernel";
      exec        = ''
        process-compose
      '';
    };

    repo = {
      description = "🌕 List top-level packages in the monorepo";
      exec        = ''
        pnpm list -r --depth -1
        pnpm nx show projects --json
      '';
    };

    pi = {
      description = "📦 Install pnpm packages";
      exec        = "set -ex; pnpm i; doctor";
    };

    pri = {
      description = "🧹 Re-install pnpm packages";
      exec        = "set -ex; clean; pnpm i; doctor";
    };

    di = {
      description = "⌨ Reload devenv";
      exec        = "set -ex; direnv reload";
    };

    dn = {
      description = "💥 Nuke & reload devenv";
      exec        = "set -ex; git clean -fdX -e '!.env*'";
    };

    clean = {
      description = "🧽 Remove all files matched by .gitignore (except any .env*)";
      exec        = "set -ex; git clean -fdX -e '!.env*' -e '!.devenv*' -e '!.direnv*'";
    };

    nuke = {
      description = "🚨 Remove all files matched by .gitignore, including .env*";
      exec        = ''
        sudo git clean -fdX
      '';
    };
  };
}
