{
  scripts = {
    graph = {
      description = "  📍 Generate an Nx dependency graph, grouped by folder";
      exec        = ''
        nx graph --groupByFolder "$@"
      '';
    };
  };
}
