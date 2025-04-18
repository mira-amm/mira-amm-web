import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Leaderboard model
export const gameScores = pgTable("game_scores", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  score: integer("score").notNull(),
  createdAt: text("created_at").notNull(),
});

// Notes model
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  content: text("content").notNull(),
  isHighlighted: integer("is_highlighted").default(0),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertGameScoreSchema = createInsertSchema(gameScores).pick({
  walletAddress: true,
  score: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  date: true,
  content: true,
  isHighlighted: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertGameScore = z.infer<typeof insertGameScoreSchema>;
export type GameScore = typeof gameScores.$inferSelect;

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
