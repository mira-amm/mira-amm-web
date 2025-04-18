import { notes, type Note, type InsertNote, gameScores, type GameScore, type InsertGameScore, users, type User, type InsertUser } from "@shared/schema";

// Storage interface for all models
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Game score methods
  getTopScores(limit: number): Promise<GameScore[]>;
  addScore(score: InsertGameScore): Promise<GameScore>;
  
  // Notes methods
  getAllNotes(): Promise<Note[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameScores: Map<number, GameScore>;
  private notes: Map<number, Note>;
  private currentUserId: number;
  private currentScoreId: number;
  private currentNoteId: number;

  constructor() {
    this.users = new Map();
    this.gameScores = new Map();
    this.notes = new Map();
    this.currentUserId = 1;
    this.currentScoreId = 1;
    this.currentNoteId = 1;
    
    // Initialize with some default notes
    this.initializeDefaultNotes();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Game score methods
  async getTopScores(limit: number): Promise<GameScore[]> {
    return Array.from(this.gameScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  async addScore(insertScore: InsertGameScore): Promise<GameScore> {
    const id = this.currentScoreId++;
    const score: GameScore = { ...insertScore, id };
    this.gameScores.set(id, score);
    return score;
  }
  
  // Notes methods
  async getAllNotes(): Promise<Note[]> {
    return Array.from(this.notes.values());
  }
  
  // Initialize with default notes
  private initializeDefaultNotes() {
    const defaultNotes: InsertNote[] = [
      {
        date: "2023-07-15",
        content: "The blockchain landscape is evolving faster than anticipated. Our positioning with the MicroChain architecture gives us a unique advantage in the market. The scalability solution we're implementing should address the bottlenecks that have plagued most layer-2 implementations.",
        isHighlighted: 0
      },
      {
        date: "2023-07-18",
        content: "Token economics model revision complete. The deflationary mechanism coupled with staking rewards creates the perfect balance for long-term sustainability. The board has approved the final parameters for launch.",
        isHighlighted: 0
      },
      {
        date: "2023-07-22",
        content: "Security audit is in progress. Initial feedback is positive. The novel consensus mechanism we've implemented has received particular praise. Looking forward to the public release and seeing the community's reaction.",
        isHighlighted: 0
      },
      {
        date: "2023-07-23",
        content: "UPCOMING: Major partnership announcement scheduled post-launch",
        isHighlighted: 1
      }
    ];
    
    defaultNotes.forEach(note => {
      const id = this.currentNoteId++;
      // Create a complete note object with required fields
      const completeNote: Note = {
        id: id,
        date: note.date,
        content: note.content,
        isHighlighted: note.isHighlighted ?? 0  // Use nullish coalescing to provide a default
      };
      this.notes.set(id, completeNote);
    });
  }
}

export const storage = new MemStorage();
