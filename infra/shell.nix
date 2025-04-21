{ pkgs ? import <nixpkgs> {}, arg ? "" }:

let
  miraLogoPath = "../libs/shared/assets/mira-wordmark-long-light.png";

in pkgs.mkShell {
  name = "microchain-dev-env";

  buildInputs = [
    pkgs.zellij
    pkgs.nerd-fonts.jetbrains-mono
    pkgs.ascii-image-converter
    pkgs.lazygit
    pkgs.btop
    pkgs.yazi
    pkgs.tgpt
    pkgs.uv
    pkgs.shellspec
    pkgs.fastfetch
    pkgs.figlet
    pkgs.lolcat
    pkgs.ansi
    pkgs.ncurses
    pkgs.postgresql
    pkgs.lazysql
    pkgs.glibcLocales
    pkgs.docker
    pkgs.lazydocker
    pkgs.supabase-cli
  ];

  shellHook = ''
    #====================================================
    #                      FLAGS
    #====================================================
    export NX_VERBOSE_LOGGING=true
    export NEXT_PUBLIC_ENABLE_AUTOLOGIN="true"
    export TERM=xterm-256color

    #====================================================
    #                    DATABASE
    #====================================================

    export PGDATA="$PWD/../libs/db/data"
    export PG_COLOR=always
    export DATABASE_URI="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

    #====================================================
    #                      PORTS
    #====================================================
    export APP_DEV_SERVER_PORT="3000"
    export MICROGAME_DEV_SERVER_PORT="8000"
    export STORYBOOK_DEV_SERVER_PORT="6006"
    export DOCS_DEV_SERVER_PORT="4000"
    export ARCHITECTURE_DEV_SERVER_PORT="5173"
    export GRAPH_DEV_SERVER_PORT="4211"
    export NODE_MODULES_INSPECTOR_PORT="7000"

    #====================================================
    #                      URLS
    #====================================================
    export BASE_URL="https://mira.ly"
    export LOCALHOST_STRING="http://localhost"

    export APP_LOCAL_URL="$LOCALHOST_STRING:$APP_DEV_SERVER_PORT"
    export MICROGAME_LOCAL_URL="$LOCALHOST_STRING:$MICROGAME_DEV_SERVER_PORT"
    export STORYBOOK_LOCAL_URL="$LOCALHOST_STRING:$ARCHITECTURE_DEV_SERVER_PORT"
    export DOCS_LOCAL_URL="$LOCALHOST_STRING:$DOCS_DEV_SERVER_PORT"
    export ARCHITECTURE_LOCAL_URL="$LOCALHOST_STRING:$ARCHITECTURE_DEV_SERVER_PORT"
    export GRAPH_LOCAL_URL="$LOCALHOST_STRING:$GRAPH_DEV_SERVER_PORT"

    export SENTIO_API_URL="https://app.sentio.xyz/api/v1/analytics/fuellabs/mira-mainnet/sql/execute"

    export PAYLOAD_SECRET="YOUR_SECRET_HERE"

    doctor() {
    shellspec --format documentation
    }

    case "${arg}" in
      doctor)
        doctor
        exit 0
        ;;
    esac

    if ! command -v posting > /dev/null; then
    uv tool install --python 3.12 posting
    fi

    zellij --config zellij.config.kdl -n zellij.layout.kdl

    pnpm nx stop db

    zellij da -y

    ascii-image-converter ${miraLogoPath} --color --full -b

    echo "🚪 Exiting Nix shell..."
    exit
  '';
}
