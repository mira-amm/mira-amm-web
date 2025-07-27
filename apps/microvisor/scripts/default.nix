{
  imports = [
    ./dev.nix
    ./doctor.nix
    ./hello.nix
    ./graph.nix
  ];

  scripts = {
    build = {
      description = "  🏗  Build with pnpm & Nx with any args passed through";
      exec        = ''
        nx build "$@"
      '';
    };

    start = {
      description = "  🚂 Serve with pnpm & Nx with any args passed through";
      exec        = ''
        nx start "$@"
      '';
    };

    ai = {
      description = "     🤖 Use the GPT LLM of your choice";
      exec        = ''
        open-webui serve --port 1212
      '';
    };

    kernel = {
      description = " 🎉 Fire up the Microvisor Kernel";
      exec        = ''
        process-compose
      '';
    };

    shell = {
      description = "  🐚 Fire up the Microvisor Shell";
      exec        = ''
        NX_TUI='false' nx dev:tui microvisor; process-compose down; supabase stop --all; zellij ka -y; zellij da -y;
      '';
    };

    console = {
      description = "🕹  Fire up the Microvisor Console";
      exec        = ''
        ttyd --writable --browser --url-arg --once process-compose
      '';
    };

    repo = {
      description = "   🌕 List top-level packages in the monorepo";
      exec        = ''
        pnpm list -r --depth -1
        nx show projects --json
      '';
    };

    pi = {
      description = "     📦 Install pnpm packages";
      exec        = "set -ex; pnpm i; doctor";
    };

    pri = {
      description = "    🧹 Re-install pnpm packages";
      exec        = "set -ex; clean; pnpm i; doctor";
    };

    di = {
      description = "      ⌨ Reload devenv";
      exec        = "set -ex; direnv reload";
    };

    dn = {
      description = "     💥 Nuke & reload devenv";
      exec        = "set -ex; git clean -fdX";
    };

    clean = {
      description = "  🧽 Remove all files matched by .gitignore (except any .env*)";
      exec        = "set -ex; git clean -fdX -e '!.devenv*' -e '!.direnv*'";
    };

    nuke = {
      description = "   🚨 Remove all files matched by .gitignore, including .env*";
      exec        = ''
        sudo git clean -fdX
      '';
    };
  };
}
