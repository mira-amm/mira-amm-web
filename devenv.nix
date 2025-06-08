{
  pkgs,
  lib,
  config,
  inputs,
  ...
}:

{
  name = "microchain-dev-env";

  languages = {
    shell.enable = true;
    nix.enable = true;
    rust = {
      enable = true;
      channel = "stable";
      targets = [ "wasm32-unknown-unknown" ];
      components = [ "rustc" "cargo" "clippy" "rustfmt" "rust-analyzer" ];
    };
    javascript = {
      enable = true;
      # bun = {
        #   enable = true;
        #   install.enable = true;
        # };
        pnpm = {
          enable = true;
          install.enable = true;
        };
    };
    typescript.enable = true;
    python = {
      enable = true;
      uv.enable = true;
    };
    ruby = { # needed for lolcat
      enable = true;
      bundler.enable = true;
    };
  };

  starship.enable = true;
  starship.config = {
    enable = true;
    path = "${config.env.DEVENV_ROOT}/libs/meshwave-ui/starship.toml";
  };

  # let
    #   rosettaPkgs = pkgs.pkgsx86_64Darwin;
    # in {
      packages = with pkgs; [
        # ========== Editors ===========
        vim
        neovim
        zellij
        nerd-fonts.jetbrains-mono

        # ============= 🧑‍💻🐞‍ ================
        git
        gh
        btop
        ncdu
        lazygit
        lazysql
        yazi
        tgpt
        shellspec
        docker
        lazydocker
        supabase-cli
        ttyd
        termshark
        pik

      # ============== 🤪 =================
        bat
        eza
        chafa
        ansi
        glibcLocales
        ncurses
        figlet
        lolcat
        fastfetch
      ] ++ lib.optionals stdenv.isLinux [
        inotify-tools
        kmon
        lazyjournal
        netscanner
        systemctl-tui
      ] ++ lib.optionals stdenv.isDarwin [
        libiconv
      ];
      #   ++ lib.optionals (pkgs.stdenv.isDarwin && pkgs.stdenv.isAarch64) [
        #     rosettaPkgs.dmd
        #   ];
        # }

        process.manager.args = {"theme"="One Dark";};

        services.postgres = {
          enable = true;
          package = pkgs.postgresql_17;
          port = 54322;
          listen_addresses = "*";
          initialDatabases = [{
            name = "postgres";
            user = "postgres";
            pass = "postgres";
          }];
          # hbaConf = "pg_hba.conf";
          settings = {
            shared_buffers = "128MB";
            dynamic_shared_memory_type = "posix";
            max_wal_size = "1GB";
            min_wal_size = "80MB";
            datestyle = "iso, mdy";
            lc_messages = "en_US.UTF-8";
            lc_monetary = "en_US.UTF-8";
            lc_numeric = "en_US.UTF-8";
            lc_time = "en_US.UTF-8";
            default_text_search_config = "pg_catalog.english";
          };
        };

        scripts.hello.exec = ''
          # figlet  Hello from $GREET | lolcat
          chafa ${config.env.DEVENV_ROOT}/libs/shared/assets/devenv-symbol-dark-bg.png
        '';

        enterShell = ''
          alias l='eza -alh  --icons=auto' # long list
          alias ls='eza -a -1   --icons=auto' # short list
          alias ll='eza -lha --icons=auto --sort=name --group-directories-first' # long list all
          alias ld='eza -lhD --icons=auto' # long list dirs
          alias lt='eza --icons=auto --tree' # list folder as tree
          alias cat='bat'
          alias mkdir='mkdir -p'

          hello
          echo 👋🧩
        '';

        enterTest = ''
          set -ex
          echo "Running tests"

          git --version | grep --color=auto "${pkgs.git.version}"

          cargo --version
          rustc --version

          process-compose down

          pnpm d
          figlet "Tests Completed 🥳" | lolcat
        '';

        process.managers.process-compose.settings = {
          processes = {
            admin = {
              command = "pnpm nx dev admin";
              description = "🍿 Admin | 8000 | admin.mira.ly";
              is_tty = true;
              depends_on = {
                  postgres.condition = "process_healthy";
              };
              ready_log_line = "Ready in";
              # readiness_probe = {
              #   http_get = {
              #     port = "8000";
              #     host = "localhost";
              #     scheme = "http";
              #   };
              # };
              namespace = "🧮 SERVERS";
              disabled = true;
            };
            microgame = {
              command = "pnpm nx dev microgame";
              is_tty = true;
              # depends_on = {
              #     admin.condition = "process_healthy";
              # };
              readiness_probe = {
                http_get = {
                  port = "4200";
                  host = "localhost";
                  scheme = "http";
                };
              };
              description = "🕹 Microgame | 4200 | microgame.mira.ly";
              namespace = "🧮 SERVERS";
              disabled = true;
            };
            web = {
              command = "pnpm nx dev web";
              description = "🦕 Web App | 3000 | mira.ly";
              is_tty = true;
              ready_log_line = "Ready in";
              namespace = "🧮 SERVERS";
            };
            api = {
              command = "pnpm nx dev api";
              description = "🧩 Core API | 8080 | api.mira.ly";
              is_tty = true;
              readiness_probe = {
                http_get = {
                  port = "8080";
                  host = "localhost";
                  scheme = "http";
                };
              };
              namespace = "🧮 SERVERS";
              disabled = true;
            };
            storybook = {
              command = "pnpm storybook";
              description = "🎨 Storybook | 6006 | design.mira.ly";
              is_tty = true;
              readiness_probe = {
                http_get = {
                  port = "6006";
                  host = "localhost";
                  scheme = "http";
                };
              };
              namespace = "🧮 SERVERS";
              disabled = true;
            };
            docs = {
              command = "pnpm nx dev docs";
              description = "📚 Docs | 4000 | docs.mira.ly";
              is_tty = true;
              ready_log_line = "Ready in";
              namespace = "🧮 SERVERS";
              disabled = true;
            };
            graph = {
              command = "pnpm nx graph --view=projects --affected";
              description = "🗺 Project Graph - Nx | 4211 | graph.mira.ly";
              is_tty = true;
              readiness_probe = {
                http_get = {
                  port = "4211";
                  host = "localhost";
                  scheme = "http";
                };
              };
              namespace = "🧮 SERVERS";
              disabled = true;
            };
            arch = {
              command = "pnpm nx dev arch";
              description = "🏛 Architecture | 5173 | arch.mira.ly";
              is_tty = true;
              readiness_probe = {
                http_get = {
                  port = "5173";
                  host = "localhost";
                  scheme = "http";
                };
              };
              namespace = "🧮 SERVERS";
              disabled = true;
            };
            drizzle = {
              command = "pnpm nx view db";
              description = "📊 Drizzle Studio | Schema Visualizer | 5600";
              namespace = "🧮 SERVERS";
              disabled = true;
            };
            inspector = {
              command = "pnpm node-modules-inspector --depth=7 --port=7000";
              description = "📦 Node Modules Inspector | 7000";
              is_tty = true;
              readiness_probe = {
                http_get = {
                  port = "7000";
                  host = "localhost";
                  scheme = "http";
                };
              };
              namespace = "🧮 SERVERS";
              disabled = true;
            };
            web-e2e = {
              command = "pnpm nx e2e web-e2e --ui";
              description = "🎭 Web | E2E(ui)";
              namespace = "🧪 TESTING";
              disabled = true;
            };
            api-tests = {
              command = "pnpm nx test api";
              description = "🧩 Core API | Unit";
              namespace = "🧪 TESTING";
              disabled = true;
            };
            microdoctor = {
              command = "pnpm nx shell microdoctor";
              description = "💊 Microdoctor";
              namespace = "🧪 TESTING";
              disabled = true;
            };
            vercel = {
              command = "pnpm nx dev platform-vercel";
              description = "🔺 Vercel";
              namespace = "☁ DEPLOYMENTS";
              disabled = true;
            };
          };
          availability = {
            restart = "on_failure";
            backoff_seconds = 2;
            max_restarts = 5;
          };
        };

        # difftastic.enable = true;
        delta.enable = true;
        git-hooks.hooks = {
          # shellcheck.enable = true;
          # eslint.enable = true;
          # cargo-check.enable = true;
          # check-json.enable = true;
          # check-toml.enable = true;
          # check-yaml.enable = true;
          commitizen.enable = true;
          # eclint.enable = true;
          # html-tidy.enable = true;
          # rustfmt.enable = true;
          # clippy.enable = true;
          # actionlint.enable = true;
        };

        # devcontainer.enable = true;
        # NOTE: Existing env variables set in devenv.nix will have priority.
        dotenv = {
          enable = true;
          filename = [
            ".env"
            # ".env.development"
            # ".env.production"
          ];
        };

        env = {
          GREET = "devenv";
          #====================================================
          #                      FLAGS
          #====================================================
          # SUPABASE=true; # Requires Docker
          # SQLITE=true;
          NX_VERBOSE_LOGGING = "true";
          NEXT_PUBLIC_ENABLE_AUTOLOGIN = "true";
          # TERM = "xterm-256color";
          ZELLIJ_AUTO_ATTACH = "true";
          ZELLIJ_AUTO_EXIT = "true";

          #====================================================
          #                    DATABASE
          #====================================================
          # PG_COLOR = "always";
          DATABASE_URI = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
          # S3_ACCESS_KEY_ID=""
          # S3_SECRET_ACCESS_KEY=""
          # S3_BUCKET="staging"
          # S3_REGION="us-east-1"
          # S3_ENDPOINT="https://[ID].supabase.co/storage/v1/s3"

          #====================================================
          #                      PORTS
          #====================================================
          APP_DEV_SERVER_PORT = "3000";
          ADMIN_DEV_SERVER_PORT = "8000";
          MICROGAME_DEV_SERVER_PORT = "4200";
          API_SERVER_PORT = "8080";
          STORYBOOK_DEV_SERVER_PORT = "6006";
          DOCS_DEV_SERVER_PORT = "4000";
          ARCHITECTURE_DEV_SERVER_PORT = "5173";
          GRAPH_DEV_SERVER_PORT = "4211";
          NODE_MODULES_INSPECTOR_PORT = "7000";

          #====================================================
          #                      URLS
          #====================================================
          BASE_URL = "https://mira.ly";
          LOCALHOST_STRING = "http://localhost";

          APP_LOCAL_URL = "$LOCALHOST_STRING:$APP_DEV_SERVER_PORT";
          ADMIN_LOCAL_URL = "$LOCALHOST_STRING:$ADMIN_DEV_SERVER_PORT";
          MICROGAME_LOCAL_URL = "$LOCALHOST_STRING:$MICROGAME_DEV_SERVER_PORT";
          API_SERVER_LOCAL_URL = "$LOCALHOST_STRING:$API_SERVER_PORT";
          STORYBOOK_LOCAL_URL = "$LOCALHOST_STRING:$ARCHITECTURE_DEV_SERVER_PORT";
          DOCS_LOCAL_URL = "$LOCALHOST_STRING:$DOCS_DEV_SERVER_PORT";
          ARCHITECTURE_LOCAL_URL = "$LOCALHOST_STRING:$ARCHITECTURE_DEV_SERVER_PORT";
          GRAPH_LOCAL_URL = "$LOCALHOST_STRING:$GRAPH_DEV_SERVER_PORT";
          SUPABASE_STUDIO_URL = "$LOCALHOST_STRING:54323";

          SENTIO_API_URL = "https://app.sentio.xyz/api/v1/analytics/fuellabs/mira-mainnet/sql/execute";
          PAYLOAD_SECRET = "YOUR_SECRET_HERE";

          CORS_WHITELIST_ORIGINS = "http://localhost:4200,http://localhost:8000,https://microgame.mira.ly,https://admin.mira.ly,https://microchain.systems,https://x.com,https://api.x.com";
          CSRF_WHITELIST_ORIGINS = "http://localhost:4200,http://localhost:8000,https://microgame.mira.ly,https://admin.mira.ly,https://microchain.systems,https://x.com,https://api.x.com";
        };
}
