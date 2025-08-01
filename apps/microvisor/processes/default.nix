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

    fastfetch = {
      exec = "fastfetch -C all.jsonc";
      process-compose = {
        namespace = "🩺 HEALTH CHECK";
        is_tty = true;
        disabled = false;
      };
    };

    open-webui = {
      exec = "open-webui serve --port 1212";
      process-compose = {
        description = "🤖 Use the GPT LLM of your choice";
        namespace = "🧮 VIEWS";
        disabled = true;
        is_tty = true;
      };
    };

    dev-admin = {
      exec = "nx dev admin";
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

    dev-microgame = {
      exec = "nx dev microgame";
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
        disabled = true;
      };
    };

    supabase-start = {
      exec = "process-compose process stop postgres; supabase start --workdir apps/microvisor/services";
      process-compose = {
        description = "🟩 Supabase | 54323";
        is_tty = true;
        depends_on = {
          postgres.condition = "process_complete";
        };
        ready_log_line = "Started supabase local development setup.";
        namespace = "📀 DATABASES";
        disabled = true;
      };
    };

    dev-web = {
      exec = "nx dev web";
      process-compose = {
        description = "🦕 Web App | 3000 | mira.ly";
        is_tty = true;
        ready_log_line = "Ready in";
        namespace = "🧮 VIEWS";
        disabled = false;
      };
    };

    test-web = {
      exec = "nx test web --run --cache --no-color=false";
      process-compose = {
        is_tty = true;
        namespace = "🔬 UNIT";
        disabled = false;
      };
    };

    dev-api = {
      exec = "nx dev api";
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

    dev-docs = {
      exec = "nx dev docs";
      process-compose = {
        description = "📚 Docs | 4000 | docs.mira.ly";
        is_tty = true;
        ready_log_line = "Ready in";
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    build-docs = {
      exec = "nx build docs";
      process-compose = {
        description = "📚 Docs | 4000 | docs.mira.ly";
        is_tty = true;
        # ready_log_line = "Ready in";
        namespace = "📦 DEPS";
        disabled = true;
      };
    };

    build-ts-sdk = {
      exec = "nx build ts-sdk";
      process-compose = {
        description = "🔌 TypeScript SDK";
        is_tty = true;
        # ready_log_line = "Ready in";
        namespace = "📦 DEPS";
        disabled = true;
      };
    };

    graph = {
      exec = "nx graph --view=projects --affected";
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

    dev-arch = {
      exec = "nx dev arch";
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
        disabled = false;
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

    view-db = {
      exec = "nx view db";
      process-compose = {
        description = "📊 Drizzle Studio | Schema Visualizer | 5600";
        namespace = "🧮 VIEWS";
        disabled = true;
      };
    };

    node-modules-inspector = {
      exec = "pnpm node-modules-inspector --depth=7 --port=7800";
      process-compose = {
        description = "📦 Node Modules Inspector | 7800";
        is_tty = true;
        readiness_probe = {
          http_get = {
            port = "7800";
            host = "localhost";
            scheme = "http";
          };
        };
        namespace = "📦 DEPS";
        disabled = true;
      };
    };

    repo = {
      exec = "repo";
      process-compose = {
        description = "🌕 List top-level packages in the monorepo";
        is_tty = true;
        namespace = "📦 DEPS";
        disabled = false;
      };
    };

    e2e-web-e2e---ui = {
      exec = "nx e2e web-e2e --ui";
      process-compose = {
        description = "🎭 Web | E2E (UI)";
        namespace = "🎭 E2E";
        disabled = true;
      };
    };

    build-api = {
      exec = "nx build api";
      process-compose = {
        description = "🧩 Core API | Build";
        namespace = "📦 DEPS";
        disabled = false;
      };
    };

    test-api = {
      exec = "nx test api";
      process-compose = {
        description = "🧩 Core API | Unit";
        namespace = "🔬 UNIT";
        disabled = false;
      };
    };

    e2e-api = {
      exec = "nx e2e api";
      process-compose = {
        description = "🧩 Core API | E2E";
        namespace = "🎭 E2E";
        disabled = false;
      };
    };

    pi = {
      exec = "pi";
      process-compose = {
        description = "🟨 Install pnpm packages";
        is_tty = true;
        namespace = "📦 DEPS";
        disabled = true;
      };
    };

    pri = {
      exec = "pri";
      process-compose = {
        description = "🧹 Re-install pnpm packages";
        is_tty = true;
        namespace = "📦 DEPS";
        disabled = true;
      };
    };

    devenv-info = {
      exec = "devenv info";
      process-compose = {
        description = "❄ devenv info";
        is_tty = true;
        namespace = "🩺 HEALTH CHECK";
        disabled = false;
      };
    };

    dev-platform-vercel  = {
      exec = "nx dev platform-vercel";
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
