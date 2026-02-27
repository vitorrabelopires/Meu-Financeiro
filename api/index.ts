import express from "express";
import { sql } from "@vercel/postgres";
import path from "path";

const app = express();
app.use(express.json());

// Initialize Database Schema for Postgres
const initDb = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        description TEXT,
        amount REAL,
        date TEXT,
        category TEXT,
        type TEXT,
        accountId TEXT,
        tags TEXT,
        creditCardId TEXT
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY, name TEXT, icon TEXT, color TEXT, type TEXT
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY, name TEXT, balance REAL, color TEXT, icon TEXT
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS credit_cards (
        id TEXT PRIMARY KEY, name TEXT, brand TEXT, bank TEXT, limit_val REAL, closingDay INTEGER, dueDay INTEGER, color TEXT
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY, name TEXT, color TEXT
      );
    `;

    // Seed defaults if empty
    const { rows: accountRows } = await sql`SELECT COUNT(*) as count FROM accounts`;
    if (parseInt(accountRows[0].count) === 0) {
      await sql`INSERT INTO accounts (id, name, balance, color, icon) VALUES ('1', 'Carteira', 0, '#000000', 'Wallet')`;
      await sql`INSERT INTO accounts (id, name, balance, color, icon) VALUES ('2', 'Conta Corrente', 0, '#333333', 'Banknote')`;
    }

    const { rows: categoryRows } = await sql`SELECT COUNT(*) as count FROM categories`;
    if (parseInt(categoryRows[0].count) === 0) {
      const defaults = [
        { id: 'c1', name: 'Alimentação', icon: 'Utensils', color: '#f59e0b', type: 'expense' },
        { id: 'c2', name: 'Transporte', icon: 'Car', color: '#3b82f6', type: 'expense' },
        { id: 'c3', name: 'Lazer', icon: 'Gamepad2', color: '#8b5cf6', type: 'expense' },
        { id: 'c4', name: 'Saúde', icon: 'HeartPulse', color: '#ef4444', type: 'expense' },
        { id: 'c5', name: 'Salário', icon: 'DollarSign', color: '#10b981', type: 'income' },
        { id: 'c6', name: 'Investimentos', icon: 'TrendingUp', color: '#000000', type: 'income' },
      ];
      for (const c of defaults) {
        await sql`INSERT INTO categories (id, name, icon, color, type) VALUES (${c.id}, ${c.name}, ${c.icon}, ${c.color}, ${c.type})`;
      }
    }
  } catch (e) {
    console.error("Database init error:", e);
  }
};

// Middleware to ensure DB is ready (simple version)
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    await initDb();
  }
  next();
});

// API Routes
app.get("/api/transactions", async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM transactions ORDER BY date DESC`;
    const transactions = rows.map((row: any) => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    }));
    res.json(transactions);
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

app.post("/api/transactions", async (req, res) => {
  const t = req.body;
  try {
    await sql`
      INSERT INTO transactions (id, description, amount, date, category, type, accountId, tags, creditCardId)
      VALUES (${t.id}, ${t.description}, ${t.amount}, ${t.date}, ${t.category}, ${t.type}, ${t.accountId}, ${JSON.stringify(t.tags || [])}, ${t.creditCardId})
    `;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

app.put("/api/transactions/:id", async (req, res) => {
  const { id } = req.params;
  const t = req.body;
  try {
    await sql`
      UPDATE transactions 
      SET description = ${t.description}, amount = ${t.amount}, date = ${t.date}, category = ${t.category}, type = ${t.type}, accountId = ${t.accountId}, tags = ${JSON.stringify(t.tags || [])}, creditCardId = ${t.creditCardId}
      WHERE id = ${id}
    `;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await sql`DELETE FROM transactions WHERE id = ${id}`;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM categories`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

app.post("/api/categories", async (req, res) => {
  const c = req.body;
  try {
    await sql`INSERT INTO categories (id, name, icon, color, type) VALUES (${c.id}, ${c.name}, ${c.icon}, ${c.color}, ${c.type})`;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

app.get("/api/accounts", async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM accounts`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

app.put("/api/accounts/:id", async (req, res) => {
  const { id } = req.params;
  const { balance } = req.body;
  try {
    await sql`UPDATE accounts SET balance = ${balance} WHERE id = ${id}`;
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

app.get("/api/credit-cards", async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM credit_cards`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

app.get("/api/tags", async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM tags`;
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

export default app;
