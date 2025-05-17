{ pkgs ? import <nixpkgs> {}, arg ? "" }:

let
  logoPath = "libs/shared/assets/mira-wordmark-long-light.png";

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
    pkgs.ttyd
  ];

  shellHook = ''
    #====================================================
    #                      FLAGS
    #====================================================
    # export SUPABASE=true # Requires Docker
    # export SQLITE=true
    export NX_VERBOSE_LOGGING=true
    export NEXT_PUBLIC_ENABLE_AUTOLOGIN="true"
    export TERM=xterm-256color
    export ZELLIJ_AUTO_ATTACH=true
    export ZELLIJ_AUTO_EXIT=true

    #====================================================
    #                    DATABASE
    #====================================================
    export PGDATA="$PWD/libs/db/data"
    export PG_COLOR=always
    export DATABASE_URI="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
    # export DATABASE_URI="postgresql://[NAME]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    # export S3_ACCESS_KEY_ID=""
    # export S3_SECRET_ACCESS_KEY=""
    # export S3_BUCKET="staging"
    # export S3_REGION="us-east-1"
    # export S3_ENDPOINT="https://[ID].supabase.co/storage/v1/s3"

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
    export SUPABASE_STUDIO_URL="$LOCALHOST_STRING:54323"

    export SENTIO_API_URL="https://app.sentio.xyz/api/v1/analytics/fuellabs/mira-mainnet/sql/execute"

    export PAYLOAD_SECRET="YOUR_SECRET_HERE"
    export CORS_WHITELIST_ORIGINS="http://localhost:8000,https://microgame.mira.ly,https://microchain.systems,https://x.com,https://api.x.com"
    export CSRF_WHITELIST_ORIGINS="http://localhost:8000,https://microgame.mira.ly,https://microchain.systems,https://x.com,https://api.x.com"

    case "${arg}" in
      doctor)
        pnpm nx check microdoctor
        exit 0
        ;;
    esac

    if ! command -v posting > /dev/null; then
    uv tool install --python 3.12 posting
    fi

    pnpm nx dev microscope;

    zellij ka -y;
    zellij da -y;

    pnpm nx stop db;

    ascii-image-converter ${logoPath} --color --full -b

    echo "🚪 Exiting Nix shell..."
    exit
  '';
}
