{
  processes = {
    microdoctor = {
      exec = "doctor";
      process-compose = {
        description = "💊 Microdoctor";
        namespace = "🩺 HEALTH CHECK";
        disabled = false;
        is_tty = true;
      };
    };

    "fastfetch -C all.jsonc" = {
      exec = "fastfetch -C all.jsonc";
      process-compose = {
        namespace = "🩺 HEALTH CHECK";
        is_tty = true;
        disabled = false;
      };
    };

    "dev admin" = {
      exec = "pnpm nx dev admin";
      process-compose = {
        description = "🍿 Admin | 8000 | admin.mira.ly";
        is_tty = true;
        depends_on = {
          postgres.condition = "process_healthy";
        };
        ready_log_line = "Ready in";
        namespace = "🧮 VIEWS";
        disabled = false;
      };
    };

    "dev microgame" = {
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

    "supabase -h" = {
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

    "dev web" = {
      exec = "pnpm nx dev web";
      process-compose = {
        description = "🦕 Web App | 3000 | mira.ly";
        is_tty = true;
        ready_log_line = "Ready in";
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    "dev api" = {
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

    storybook = {
      exec = "pnpm storybook";
      process-compose = {
        description = "🎨 Storybook | 6006 | design.mira.ly";
        is_tty = true;
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    docs = {
      exec = "pnpm nx dev docs";
      process-compose = {
        description = "📚 Docs | 4000 | docs.mira.ly";
        is_tty = true;
        ready_log_line = "Ready in";
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    graph = {
      exec = "pnpm nx graph --view=projects --affected";
      process-compose = {
        description = "🗺 Project Graph - Nx | 4211 | graph.mira.ly";
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

    arch = {
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

    hello = {
      exec = "hello";
      process-compose = {
        description = "👋🧩 Show the Devenv logo art and a friendly greeting";
        namespace = "🩺 HEALTH CHECK";
        disabled = true;
      };
    };

    console = {
      exec        = ''
         ttyd --writable --browser --url-arg --once devenv up
      '';
      process-compose = {
        description = "🕹 Attach the Microvisor Kernel to the Browser";
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    "view db" = {
      exec = "pnpm nx view db";
      process-compose = {
        description = "📊 Drizzle Studio | Schema Visualizer | 5600";
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    "node-modules-inspector --depth=7 --port=7000" = {
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
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    "repo" = {
      exec = "repo";
      process-compose = {
        description = "🌕 List top-level packages in the monorepo";
        is_tty = true;
        namespace = "📦 DEPENDENCY MANAGEMENT";
        disabled = false;
      };
    };

    "e2e web-e2e --ui" = {
      exec = "pnpm nx e2e web-e2e --ui";
      process-compose = {
        description = "🎭 Web | E2E (UI)";
        namespace = "🧪 TESTING";
        disabled = true;
      };
    };

    "test api" = {
      exec = "pnpm nx test api";
      process-compose = {
        description = "🧩 Core API | Unit";
        namespace = "🧪 TESTING";
        disabled = true;
      };
    };

    "e2e api" = {
      exec = "pnpm nx e2e api";
      process-compose = {
        description = "🧩 Core API | E2E";
        namespace = "🧪 TESTING";
        disabled = true;
      };
    };

    "pnpm i; doctor" = {
      exec = "pi";
      process-compose = {
        description = "🟨 Install pnpm packages";
        is_tty = true;
        namespace = "📦 DEPENDENCY MANAGEMENT";
        disabled = true;
      };
    };

    "clean; pnpm i; doctor" = {
      exec = "pri";
      process-compose = {
        description = "🧹 Re-install pnpm packages";
        is_tty = true;
        namespace = "📦 DEPENDENCY MANAGEMENT";
        disabled = true;
      };
    };

    "devenv info" = {
      exec = "devenv info";
      process-compose = {
        description = "❄ devenv info log";
        is_tty = true;
        namespace = "🩺 HEALTH CHECK";
        disabled = false;
      };
    };

    vercel = {
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
