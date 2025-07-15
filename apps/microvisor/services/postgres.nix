{ pkgs, ... }:

{
  services.postgres = {
    enable = true;
    package = pkgs.postgresql_17;
    port = 54322;
    listen_addresses = "*";
    initialDatabases = [
      {
        name = "postgres";
        user = "postgres";
        pass = "postgres";
      }
    ];
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
    extensions =
      extensions: with extensions; [
        pgvector
        pgsodium
        plpgsql_check
        # pgvectorscale
      ];
  };
}
