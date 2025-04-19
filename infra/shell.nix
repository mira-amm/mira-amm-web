{ pkgs ? import <nixpkgs> {}, arg ? "" }:

let
  logoPath = "../libs/shared/assets/charthouse-labs-symbol.png";
  miraLogoPath = "../libs/shared/assets/mira-wordmark-long-light.png";
  pgLog = "$PGDATA/postgresql.log";

in pkgs.mkShell {
  name = "mira-dev-env";

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
  ];

  shellHook = ''
    #====================================================
    #                    DATABASE
    #====================================================
    export DATABASE_USER="postgres"
    export DATABASE_PASSWORD="password"
    export DATABASE_HOST="localhost"
    export DATABASE_PORT="5432"
    export DATABASE_NAME="postgres"
    export DATABASE_URI="postgres://$DATABASE_USER:$DATABASE_PASSWORD@$DATABASE_HOST:$DATABASE_PORT/$DATABASE_NAME"

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

    #====================================================
    #                      FLAGS
    #====================================================
    export NX_VERBOSE_LOGGING=true
    export NEXT_PUBLIC_ENABLE_AUTOLOGIN="true"
    export TERM=xterm-256color

    doctor() {
    shellspec --format documentation
    }

    export PGDATABASE="$DATABASE_NAME"
    export PGPASSWORD="$DATABASE_PASSWORD"
    export PGUSER="$DATABASE_USER"
    export PGHOST="$DATABASE_HOST"
    export PGPORT="$DATABASE_PORT"
    export PGDATA="$PWD/pgdata"

    alias psqlx="psql -p $PGPORT -d $PGDATABASE -U $PGUSER"

    case "${arg}" in
      doctor)
        doctor
        exit 0
        ;;
    esac

    uv tool install --python 3.12 posting

    zellij --config zellij.config.kdl -n zellij.layout.kdl

    ascii-image-converter ${miraLogoPath} --color -f -b

    zellij da -y

    echo "🚪 Exiting Nix shell..."
    exit
  '';
}
