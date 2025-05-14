import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_brands_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__brands_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_games_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__games_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_constants_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__constants_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE IF NOT EXISTS "brands_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"link" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"symbol_id" integer,
  	"wordmark_id" integer,
  	"name" varchar,
  	"description" varchar,
  	"domain" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_brands_status" DEFAULT 'draft'
  );
  
  CREATE TABLE IF NOT EXISTS "_brands_v_version_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"link" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_brands_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_symbol_id" integer,
  	"version_wordmark_id" integer,
  	"version_name" varchar,
  	"version_description" varchar,
  	"version_domain" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__brands_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE IF NOT EXISTS "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"prefix" varchar DEFAULT 'media',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE IF NOT EXISTS "games" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"player_id" integer,
  	"score" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_games_status" DEFAULT 'draft'
  );
  
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
  
  CREATE TABLE IF NOT EXISTS "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"avatar_id" integer,
  	"wallet_address" varchar,
  	"x_user_name" varchar,
  	"x_url" varchar,
  	"x_is_identity_verified" boolean,
  	"x_verified" boolean,
  	"sub" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"brands_id" integer,
  	"media_id" integer,
  	"games_id" integer,
  	"leaderboards_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "constants_microgame_login_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "constants_microgame_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"option" varchar,
  	"description" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "constants_microgame_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "constants_microgame_instructions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"instruction" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "constants" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"microgame_login_logo_id" integer,
  	"microgame_title" varchar,
  	"microgame_last_login" varchar,
  	"microgame_welcome" varchar,
  	"microgame_help" varchar,
  	"microgame_options_title" varchar,
  	"microgame_section_title" varchar,
  	"microgame_subtitle" varchar,
  	"microgame_trading_instructions_title" varchar,
  	"_status" "enum_constants_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE IF NOT EXISTS "_constants_v_version_microgame_login_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_constants_v_version_microgame_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"option" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_constants_v_version_microgame_notes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_constants_v_version_microgame_instructions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"instruction" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_constants_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_microgame_login_logo_id" integer,
  	"version_microgame_title" varchar,
  	"version_microgame_last_login" varchar,
  	"version_microgame_welcome" varchar,
  	"version_microgame_help" varchar,
  	"version_microgame_options_title" varchar,
  	"version_microgame_section_title" varchar,
  	"version_microgame_subtitle" varchar,
  	"version_microgame_trading_instructions_title" varchar,
  	"version__status" "enum__constants_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  DO $$ BEGIN
   ALTER TABLE "brands_links" ADD CONSTRAINT "brands_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "brands" ADD CONSTRAINT "brands_symbol_id_media_id_fk" FOREIGN KEY ("symbol_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "brands" ADD CONSTRAINT "brands_wordmark_id_media_id_fk" FOREIGN KEY ("wordmark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_brands_v_version_links" ADD CONSTRAINT "_brands_v_version_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_brands_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_brands_v" ADD CONSTRAINT "_brands_v_parent_id_brands_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_brands_v" ADD CONSTRAINT "_brands_v_version_symbol_id_media_id_fk" FOREIGN KEY ("version_symbol_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_brands_v" ADD CONSTRAINT "_brands_v_version_wordmark_id_media_id_fk" FOREIGN KEY ("version_wordmark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "games" ADD CONSTRAINT "games_player_id_users_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
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
  
  DO $$ BEGIN
   ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_games_fk" FOREIGN KEY ("games_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leaderboards_fk" FOREIGN KEY ("leaderboards_id") REFERENCES "public"."leaderboards"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "constants_microgame_login_text" ADD CONSTRAINT "constants_microgame_login_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."constants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "constants_microgame_options" ADD CONSTRAINT "constants_microgame_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."constants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "constants_microgame_notes" ADD CONSTRAINT "constants_microgame_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."constants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "constants_microgame_instructions" ADD CONSTRAINT "constants_microgame_instructions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."constants"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "constants" ADD CONSTRAINT "constants_microgame_login_logo_id_media_id_fk" FOREIGN KEY ("microgame_login_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_constants_v_version_microgame_login_text" ADD CONSTRAINT "_constants_v_version_microgame_login_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_constants_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_constants_v_version_microgame_options" ADD CONSTRAINT "_constants_v_version_microgame_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_constants_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_constants_v_version_microgame_notes" ADD CONSTRAINT "_constants_v_version_microgame_notes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_constants_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_constants_v_version_microgame_instructions" ADD CONSTRAINT "_constants_v_version_microgame_instructions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_constants_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_constants_v" ADD CONSTRAINT "_constants_v_version_microgame_login_logo_id_media_id_fk" FOREIGN KEY ("version_microgame_login_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "brands_links_order_idx" ON "brands_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "brands_links_parent_id_idx" ON "brands_links" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "brands_symbol_idx" ON "brands" USING btree ("symbol_id");
  CREATE INDEX IF NOT EXISTS "brands_wordmark_idx" ON "brands" USING btree ("wordmark_id");
  CREATE INDEX IF NOT EXISTS "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "brands_created_at_idx" ON "brands" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "brands__status_idx" ON "brands" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_brands_v_version_links_order_idx" ON "_brands_v_version_links" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_brands_v_version_links_parent_id_idx" ON "_brands_v_version_links" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_brands_v_parent_idx" ON "_brands_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_brands_v_version_version_symbol_idx" ON "_brands_v" USING btree ("version_symbol_id");
  CREATE INDEX IF NOT EXISTS "_brands_v_version_version_wordmark_idx" ON "_brands_v" USING btree ("version_wordmark_id");
  CREATE INDEX IF NOT EXISTS "_brands_v_version_version_updated_at_idx" ON "_brands_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_brands_v_version_version_created_at_idx" ON "_brands_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_brands_v_version_version__status_idx" ON "_brands_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_brands_v_created_at_idx" ON "_brands_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_brands_v_updated_at_idx" ON "_brands_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_brands_v_latest_idx" ON "_brands_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "games_player_idx" ON "games" USING btree ("player_id");
  CREATE INDEX IF NOT EXISTS "games_updated_at_idx" ON "games" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "games_created_at_idx" ON "games" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "games__status_idx" ON "games" USING btree ("_status");
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
  CREATE INDEX IF NOT EXISTS "users_avatar_idx" ON "users" USING btree ("avatar_id");
  CREATE INDEX IF NOT EXISTS "users_sub_idx" ON "users" USING btree ("sub");
  CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_games_id_idx" ON "payload_locked_documents_rels" USING btree ("games_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_leaderboards_id_idx" ON "payload_locked_documents_rels" USING btree ("leaderboards_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "constants_microgame_login_text_order_idx" ON "constants_microgame_login_text" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "constants_microgame_login_text_parent_id_idx" ON "constants_microgame_login_text" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "constants_microgame_options_order_idx" ON "constants_microgame_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "constants_microgame_options_parent_id_idx" ON "constants_microgame_options" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "constants_microgame_notes_order_idx" ON "constants_microgame_notes" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "constants_microgame_notes_parent_id_idx" ON "constants_microgame_notes" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "constants_microgame_instructions_order_idx" ON "constants_microgame_instructions" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "constants_microgame_instructions_parent_id_idx" ON "constants_microgame_instructions" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "constants_microgame_login_microgame_login_logo_idx" ON "constants" USING btree ("microgame_login_logo_id");
  CREATE INDEX IF NOT EXISTS "constants__status_idx" ON "constants" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_constants_v_version_microgame_login_text_order_idx" ON "_constants_v_version_microgame_login_text" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_constants_v_version_microgame_login_text_parent_id_idx" ON "_constants_v_version_microgame_login_text" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_constants_v_version_microgame_options_order_idx" ON "_constants_v_version_microgame_options" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_constants_v_version_microgame_options_parent_id_idx" ON "_constants_v_version_microgame_options" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_constants_v_version_microgame_notes_order_idx" ON "_constants_v_version_microgame_notes" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_constants_v_version_microgame_notes_parent_id_idx" ON "_constants_v_version_microgame_notes" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_constants_v_version_microgame_instructions_order_idx" ON "_constants_v_version_microgame_instructions" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_constants_v_version_microgame_instructions_parent_id_idx" ON "_constants_v_version_microgame_instructions" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_constants_v_version_microgame_login_version_microgame_login_logo_idx" ON "_constants_v" USING btree ("version_microgame_login_logo_id");
  CREATE INDEX IF NOT EXISTS "_constants_v_version_version__status_idx" ON "_constants_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_constants_v_created_at_idx" ON "_constants_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_constants_v_updated_at_idx" ON "_constants_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_constants_v_latest_idx" ON "_constants_v" USING btree ("latest");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "brands_links" CASCADE;
  DROP TABLE "brands" CASCADE;
  DROP TABLE "_brands_v_version_links" CASCADE;
  DROP TABLE "_brands_v" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "games" CASCADE;
  DROP TABLE "_games_v" CASCADE;
  DROP TABLE "leaderboards" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "constants_microgame_login_text" CASCADE;
  DROP TABLE "constants_microgame_options" CASCADE;
  DROP TABLE "constants_microgame_notes" CASCADE;
  DROP TABLE "constants_microgame_instructions" CASCADE;
  DROP TABLE "constants" CASCADE;
  DROP TABLE "_constants_v_version_microgame_login_text" CASCADE;
  DROP TABLE "_constants_v_version_microgame_options" CASCADE;
  DROP TABLE "_constants_v_version_microgame_notes" CASCADE;
  DROP TABLE "_constants_v_version_microgame_instructions" CASCADE;
  DROP TABLE "_constants_v" CASCADE;
  DROP TYPE "public"."enum_brands_status";
  DROP TYPE "public"."enum__brands_v_version_status";
  DROP TYPE "public"."enum_games_status";
  DROP TYPE "public"."enum__games_v_version_status";
  DROP TYPE "public"."enum_constants_status";
  DROP TYPE "public"."enum__constants_v_version_status";`)
}
