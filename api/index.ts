import express from "express";
import { neon } from "@neondatabase/serverless";

const app = express();
app.use(express.json());

const sql = process.env.POSTGRES_URL ? neon(process.env.POSTGRES_URL) : null;

let dbInitialized = false;

// Initialize Postgres tables
const initPostgres = async () => {
  if (!sql) {
    console.error("POSTGRES_URL is missing!");
    return;
  }
  try {
    console.log("Initializing database tables...");
    await sql`CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, description TEXT, amount REAL, date TEXT, category TEXT, type TEXT, accountId TEXT, tags TEXT, creditCardId TEXT, userId TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT, icon TEXT, color TEXT, type TEXT, userId TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, name TEXT, balance REAL, color TEXT, icon TEXT, userId TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS credit_cards (id TEXT PRIMARY KEY, name TEXT, brand TEXT, bank TEXT, limit_val REAL, closingDay INTEGER, dueDay INTEGER, color TEXT, userId TEXT)`;
    await sql`CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, name TEXT, color TEXT, userId TEXT)`;
    dbInitialized = true;
    console.log("Database tables initialized successfully.");
  } catch (e) {
    console.error("Postgres initialization error:", e);
  }
};

// Middleware to ensure DB is initialized
app.use(async (req, res, next) => {
  if (sql && !dbInitialized) {
    await initPostgres();
  }
  next();
});

// API Routes
const getUserId = (req: any) => req.headers["x-user-id"];
const isAdmin = (req: any) => req.headers["x-is-admin"] === "true";

app.get("/api/transactions", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const userId = getUserId(req);
  const admin = isAdmin(req);
  if (!userId && !admin) return res.status(401).json({ error: "Unauthorized" });

  try {
    const rows = admin 
      ? await sql`SELECT * FROM transactions ORDER BY date DESC` 
      : await sql`SELECT * FROM transactions WHERE userId = ${userId} ORDER BY date DESC`;
    const transactions = rows.map((row: any) => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    }));
    res.json(transactions);
  } catch (e: any) { res.status(500).json({ error: e.message || e }); }
});

app.post("/api/transactions", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const t = req.body;
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await sql`INSERT INTO transactions (id, description, amount, date, category, type, accountId, tags, creditCardId, userId) VALUES (${t.id}, ${t.description}, ${t.amount}, ${t.date}, ${t.category}, ${t.type}, ${t.accountId}, ${JSON.stringify(t.tags || [])}, ${t.creditCardId}, ${userId})`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message || e }); }
});

app.put("/api/transactions/:id", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const { id } = req.params;
  const t = req.body;
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await sql`UPDATE transactions SET description = ${t.description}, amount = ${t.amount}, date = ${t.date}, category = ${t.category}, type = ${t.type}, accountId = ${t.accountId}, tags = ${JSON.stringify(t.tags || [])}, creditCardId = ${t.creditCardId} WHERE id = ${id} AND userId = ${userId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message || e }); }
});

app.delete("/api/transactions/:id", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const { id } = req.params;
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await sql`DELETE FROM transactions WHERE id = ${id} AND userId = ${userId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message || e }); }
});

app.get("/api/categories", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const userId = getUserId(req);
  const admin = isAdmin(req);
  if (!userId && !admin) return res.status(401).json({ error: "Unauthorized" });

  try {
    let rows = admin 
      ? await sql`SELECT * FROM categories` 
      : await sql`SELECT * FROM categories WHERE userId = ${userId}`;
    
    if (!admin && rows.length === 0) {
      const defaults = [
        { id: 'c1', name: 'Alimentação', icon: 'Utensils', color: '#f59e0b', type: 'expense' },
        { id: 'c2', name: 'Transporte', icon: 'Car', color: '#3b82f6', type: 'expense' },
        { id: 'c3', name: 'Lazer', icon: 'Gamepad2', color: '#8b5cf6', type: 'expense' },
        { id: 'c4', name: 'Saúde', icon: 'HeartPulse', color: '#ef4444', type: 'expense' },
        { id: 'c5', name: 'Salário', icon: 'DollarSign', color: '#10b981', type: 'income' },
        { id: 'c6', name: 'Investimentos', icon: 'TrendingUp', color: '#000000', type: 'income' },
      ];
      for (const c of defaults) {
        await sql`INSERT INTO categories (id, name, icon, color, type, userId) VALUES (${c.id + '_' + userId}, ${c.name}, ${c.icon}, ${c.color}, ${c.type}, ${userId})`;
      }
      rows = await sql`SELECT * FROM categories WHERE userId = ${userId}`;
    }
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message || e }); }
});

app.post("/api/categories", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const c = req.body;
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await sql`INSERT INTO categories (id, name, icon, color, type, userId) VALUES (${c.id}, ${c.name}, ${c.icon}, ${c.color}, ${c.type}, ${userId})`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message || e }); }
});

app.get("/api/accounts", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const userId = getUserId(req);
  const admin = isAdmin(req);
  if (!userId && !admin) return res.status(401).json({ error: "Unauthorized" });

  try {
    let rows = admin 
      ? await sql`SELECT * FROM accounts` 
      : await sql`SELECT * FROM accounts WHERE userId = ${userId}`;
    
    if (!admin && rows.length === 0) {
      await sql`INSERT INTO accounts (id, name, balance, color, icon, userId) VALUES (${'1_' + userId}, 'Carteira', 0, '#000000', 'Wallet', ${userId})`;
      await sql`INSERT INTO accounts (id, name, balance, color, icon, userId) VALUES (${'2_' + userId}, 'Conta Corrente', 0, '#333333', 'Banknote', ${userId})`;
      rows = await sql`SELECT * FROM accounts WHERE userId = ${userId}`;
    }
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message || e }); }
});

app.put("/api/accounts/:id", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const { id } = req.params;
  const { balance } = req.body;
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    await sql`UPDATE accounts SET balance = ${balance} WHERE id = ${id} AND userId = ${userId}`;
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message || e }); }
});

app.get("/api/credit-cards", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const userId = getUserId(req);
  const admin = isAdmin(req);
  if (!userId && !admin) return res.status(401).json({ error: "Unauthorized" });

  try {
    const rows = admin 
      ? await sql`SELECT * FROM credit_cards` 
      : await sql`SELECT * FROM credit_cards WHERE userId = ${userId}`;
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message || e }); }
});

app.get("/api/tags", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const userId = getUserId(req);
  const admin = isAdmin(req);
  if (!userId && !admin) return res.status(401).json({ error: "Unauthorized" });

  try {
    const rows = admin 
      ? await sql`SELECT * FROM tags` 
      : await sql`SELECT * FROM tags WHERE userId = ${userId}`;
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message || e }); }
});

export default app;
