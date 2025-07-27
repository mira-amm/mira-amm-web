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

  env = {
    # PG_COLOR = "always";
    DATABASE_URI = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
    # S3_ACCESS_KEY_ID=""
    # S3_SECRET_ACCESS_KEY=""
    # S3_BUCKET="staging"
    # S3_REGION="us-east-1"
    # S3_ENDPOINT="https://[ID].supabase.co/storage/v1/s3"
  };
}
