{
  scripts = {
    graph = {
      description = "  📍 Generate an Nx dependency graph, grouped by folder";
      exec        = ''
        pnpm nx graph --groupByFolder "$@"
      '';
    };
  };
}
