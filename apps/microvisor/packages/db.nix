{pkgs, ...}:

{
  name = "📀 db";

  packages = with pkgs; [
    supabase-cli
    lazysql
    lazydocker
  ];
}
