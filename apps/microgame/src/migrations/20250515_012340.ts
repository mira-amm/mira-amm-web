import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "_games_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "leaderboards" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "_games_v" CASCADE;
  DROP TABLE "leaderboards" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_leaderboards_fk";
  
  DROP INDEX IF EXISTS "games__status_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_leaderboards_id_idx";
  ALTER TABLE "games" ALTER COLUMN "score" SET NOT NULL;
  CREATE INDEX IF NOT EXISTS "games_score_idx" ON "games" USING btree ("score");
  ALTER TABLE "games" DROP COLUMN IF EXISTS "_status";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "leaderboards_id";
  DROP TYPE "public"."enum_games_status";
  DROP TYPE "public"."enum__games_v_version_status";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_games_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__games_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE IF NOT EXISTS "_games_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_player_id" integer,
  	"version_score" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__games_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "leaderboards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  DROP INDEX IF EXISTS "games_score_idx";
  ALTER TABLE "games" ALTER COLUMN "score" DROP NOT NULL;
  ALTER TABLE "games" ADD COLUMN "_status" "enum_games_status" DEFAULT 'draft';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "leaderboards_id" integer;
  DO $$ BEGIN
   ALTER TABLE "_games_v" ADD CONSTRAINT "_games_v_parent_id_games_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_games_v" ADD CONSTRAINT "_games_v_version_player_id_users_id_fk" FOREIGN KEY ("version_player_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "_games_v_parent_idx" ON "_games_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_games_v_version_version_player_idx" ON "_games_v" USING btree ("version_player_id");
  CREATE INDEX IF NOT EXISTS "_games_v_version_version_updated_at_idx" ON "_games_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_games_v_version_version_created_at_idx" ON "_games_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_games_v_version_version__status_idx" ON "_games_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_games_v_created_at_idx" ON "_games_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_games_v_updated_at_idx" ON "_games_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_games_v_latest_idx" ON "_games_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "leaderboards_updated_at_idx" ON "leaderboards" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "leaderboards_created_at_idx" ON "leaderboards" USING btree ("created_at");
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leaderboards_fk" FOREIGN KEY ("leaderboards_id") REFERENCES "public"."leaderboards"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "games__status_idx" ON "games" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_leaderboards_id_idx" ON "payload_locked_documents_rels" USING btree ("leaderboards_id");`)
}
