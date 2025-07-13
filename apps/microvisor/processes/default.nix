{
  processes = {
    "💊 Microdoctor" = {
      exec = "doctor";
      process-compose = {
        description = "💊 Microdoctor";
        namespace = "🩺 HEALTH CHECK";
        disabled = false;
        is_tty = true;
      };
    };

    "🔮 fastfetch -C all.jsonc" = {
      exec = "fastfetch -C all.jsonc";
      process-compose = {
        namespace = "🩺 HEALTH CHECK";
        is_tty = true;
        disabled = false;
      };
    };

    "🛞 dev admin" = {
      exec = "pnpm nx dev admin";
      process-compose = {
        description = "🛞 Admin | 8000 | admin.mira.ly";
        is_tty = true;
        depends_on = {
          postgres.condition = "process_healthy";
        };
        ready_log_line = "Ready in";
        namespace = "🧮 VIEWS";
        disabled = false;
      };
    };

    "🕹 dev microgame" = {
      exec = "pnpm nx dev microgame";
      process-compose = {
        is_tty = true;
        readiness_probe = {
          http_get = {
            port = "4200";
            host = "localhost";
            scheme = "http";
          };
        };
        description = "🕹 Microgame | 4200 | microgame.mira.ly";
        namespace = "🧮 VIEWS";
        disabled = false;
      };
    };

    "🟩 supabase -h" = {
      exec = "supabase -h";
      process-compose = {
        description = "🟩 Supabase | 54323";
        is_tty = true;
        depends_on = {
          postgres.condition = "process_healthy";
        };
        ready_log_line = "Ready in";
        namespace = "📀 DATABASES";
        disabled = true;
      };
    };

    "🦕 dev web" = {
      exec = "pnpm nx dev web";
      process-compose = {
        description = "🦕 Web App | 3000 | mira.ly";
        is_tty = true;
        ready_log_line = "Ready in";
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    "⚗ test web" = {
      exec = "pnpm nx test web --run --cache --no-color=false";
      process-compose = {
        is_tty = true;
        namespace = "🔬 UNIT";
        disabled = false;
      };
    };

    "🧩 dev api" = {
      exec = "pnpm nx dev api";
      process-compose = {
        description = "🧩 Core API | 8080 | api.mira.ly";
        is_tty = true;
        readiness_probe = {
          http_get = {
            port = "8080";
            host = "localhost";
            scheme = "http";
          };
        };
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    "🎨 storybook" = {
      exec = "pnpm storybook";
      process-compose = {
        description = "🎨 Storybook | 6006 | design.mira.ly";
        is_tty = true;
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    "📚 dev docs" = {
      exec = "pnpm nx dev docs";
      process-compose = {
        description = "📚 Docs | 4000 | docs.mira.ly";
        is_tty = true;
        ready_log_line = "Ready in";
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    "🏗 build docs" = {
      exec = "pnpm nx build docs";
      process-compose = {
        description = "📚 Docs | 4000 | docs.mira.ly";
        is_tty = true;
        # ready_log_line = "Ready in";
        namespace = "📦 DEPS";
        disabled = true;
      };
    };

    "🏗 build mira-v1-ts" = {
      exec = "pnpm nx build mira-v1-ts";
      process-compose = {
        description = "🔌 TypeScript SDK";
        is_tty = true;
        # ready_log_line = "Ready in";
        namespace = "📦 DEPS";
        disabled = true;
      };
    };

    "📍 graph --view=project --groupByFolder --affected" = {
      exec = "pnpm nx graph --view=projects --affected";
      process-compose = {
        description = "📍 Project Graph - Nx | 4211 | graph.mira.ly";
        is_tty = true;
        readiness_probe = {
          http_get = {
            port = "4211";
            host = "localhost";
            scheme = "http";
          };
        };
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    "🏛 dev arch" = {
      exec = "pnpm nx dev arch";
      process-compose = {
        description = "🏛 Architecture | 5173 | arch.mira.ly";
        is_tty = true;
        readiness_probe = {
          http_get = {
            port = "5173";
            host = "localhost";
            scheme = "http";
          };
        };
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    "👋 hello" = {
      exec = "hello";
      process-compose = {
        description = "👋🧩 Show the Devenv logo art and a friendly greeting";
        namespace = "🩺 HEALTH CHECK";
        disabled = false;
      };
    };

    "🕹 console" = {
      exec        = ''
         ttyd --writable --browser --url-arg --once devenv up
      '';
      process-compose = {
        description = "🕹 Attach the Microvisor Kernel to the Browser";
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    "📊 view db" = {
      exec = "pnpm nx view db";
      process-compose = {
        description = "📊 Drizzle Studio | Schema Visualizer | 5600";
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    "📦 node-modules-inspector --depth=7 --port=7000" = {
      exec = "pnpm node-modules-inspector --depth=7 --port=7000";
      process-compose = {
        description = "📦 Node Modules Inspector | 7000";
        is_tty = true;
        readiness_probe = {
          http_get = {
            port = "7000";
            host = "localhost";
            scheme = "http";
          };
        };
        namespace = "📦 DEPS";
        disabled = true;
      };
    };

    "🌕 repo" = {
      exec = "repo";
      process-compose = {
        description = "🌕 List top-level packages in the monorepo";
        is_tty = true;
        namespace = "📦 DEPS";
        disabled = false;
      };
    };

    "🧐 e2e web-e2e --ui" = {
      exec = "pnpm nx e2e web-e2e --ui";
      process-compose = {
        description = "🎭 Web | E2E (UI)";
        namespace = "🎭 E2E";
        disabled = true;
      };
    };

    "🏗 build api" = {
      exec = "pnpm nx build api";
      process-compose = {
        description = "🧩 Core API | Build";
        namespace = "📦 DEPS";
        disabled = false;
      };
    };

    "⚗ test api" = {
      exec = "pnpm nx test api";
      process-compose = {
        description = "🧩 Core API | Unit";
        namespace = "🔬 UNIT";
        disabled = false;
      };
    };

    "🧐 e2e api" = {
      exec = "pnpm nx e2e api";
      process-compose = {
        description = "🧩 Core API | E2E";
        namespace = "🎭 E2E";
        disabled = false;
      };
    };

    "🔮 pnpm i; doctor" = {
      exec = "pi";
      process-compose = {
        description = "🟨 Install pnpm packages";
        is_tty = true;
        namespace = "📦 DEPS";
        disabled = true;
      };
    };

    "🌪 clean; pnpm i; doctor" = {
      exec = "pri";
      process-compose = {
        description = "🧹 Re-install pnpm packages";
        is_tty = true;
        namespace = "📦 DEPS";
        disabled = true;
      };
    };

    "ℹ devenv info" = {
      exec = "devenv info";
      process-compose = {
        description = "❄ devenv info";
        is_tty = true;
        namespace = "🩺 HEALTH CHECK";
        disabled = false;
      };
    };

    "🔺 dev platform-vercel"  = {
      exec = "pnpm nx dev platform-vercel";
      process-compose = {
        description = "🔺 Vercel";
        namespace = "☁ DEPLOYMENTS";
        disabled = true;
      };
    };
  };

  process = {
    manager.args = {"theme" = "One Dark";};
    managers.process-compose.settings.availability = {
      restart = "on_failure";
      backoff_seconds = 2;
      max_restarts = 5;
    };
  };
}
