import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameScoreSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all notes
  app.get("/api/notes", async (_req: Request, res: Response) => {
    try {
      const notes = await storage.getAllNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notes" });
    }
  });
  
  // Get top scores
  app.get("/api/scores", async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 10;
      const scores = await storage.getTopScores(limit);
      res.json(scores);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scores" });
    }
  });
  
  // Add a new score
  app.post("/api/scores", async (req: Request, res: Response) => {
    try {
      // Validate input
      const validatedData = insertGameScoreSchema.parse({
        ...req.body,
        createdAt: new Date().toISOString()
      });
      
      // Add score
      const newScore = await storage.addScore(validatedData);
      res.status(201).json(newScore);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add score" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
