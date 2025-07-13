{
  scripts = {
    dev = {
      description = "🚀 Start the Nx dev server with any args passed through";
      exec        = ''
        pnpm nx dev "$@"
      '';
    };
  };
}
