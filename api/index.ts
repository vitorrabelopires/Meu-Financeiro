import express from "express";
import Database from "better-sqlite3";
import path from "path";

const app = express();
app.use(express.json());

// Note: In Vercel serverless functions, SQLite might not persist data between calls.
// For production on Vercel, use Vercel Postgres.
const db = new Database("/tmp/finance.db");

// Initialize Database (Same as server.ts)
db.exec(`
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
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, name TEXT, icon TEXT, color TEXT, type TEXT
  );
  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY, name TEXT, balance REAL, color TEXT, icon TEXT
  );
  CREATE TABLE IF NOT EXISTS credit_cards (
    id TEXT PRIMARY KEY, name TEXT, brand TEXT, bank TEXT, limit_val REAL, closingDay INTEGER, dueDay INTEGER, color TEXT
  );
  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY, name TEXT, color TEXT
  );
`);

// API Routes (Same as server.ts)
app.get("/api/transactions", (req, res) => {
  const rows = db.prepare("SELECT * FROM transactions ORDER BY date DESC").all();
  const transactions = rows.map((row: any) => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : []
  }));
  res.json(transactions);
});

app.post("/api/transactions", (req, res) => {
  const t = req.body;
  const stmt = db.prepare(`
    INSERT INTO transactions (id, description, amount, date, category, type, accountId, tags, creditCardId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(t.id, t.description, t.amount, t.date, t.category, t.type, t.accountId, JSON.stringify(t.tags || []), t.creditCardId);
  res.json({ success: true });
});

app.put("/api/transactions/:id", (req, res) => {
  const { id } = req.params;
  const t = req.body;
  const stmt = db.prepare(`
    UPDATE transactions 
    SET description = ?, amount = ?, date = ?, category = ?, type = ?, accountId = ?, tags = ?, creditCardId = ?
    WHERE id = ?
  `);
  stmt.run(t.description, t.amount, t.date, t.category, t.type, t.accountId, JSON.stringify(t.tags || []), t.creditCardId, id);
  res.json({ success: true });
});

app.delete("/api/transactions/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
  res.json({ success: true });
});

app.get("/api/categories", (req, res) => {
  res.json(db.prepare("SELECT * FROM categories").all());
});

app.post("/api/categories", (req, res) => {
  const c = req.body;
  db.prepare("INSERT INTO categories (id, name, icon, color, type) VALUES (?, ?, ?, ?, ?)")
    .run(c.id, c.name, c.icon, c.color, c.type);
  res.json({ success: true });
});

app.get("/api/accounts", (req, res) => {
  res.json(db.prepare("SELECT * FROM accounts").all());
});

app.put("/api/accounts/:id", (req, res) => {
  const { id } = req.params;
  const { balance } = req.body;
  db.prepare("UPDATE accounts SET balance = ? WHERE id = ?").run(balance, id);
  res.json({ success: true });
});

app.get("/api/credit-cards", (req, res) => {
  res.json(db.prepare("SELECT * FROM credit_cards").all());
});

app.get("/api/tags", (req, res) => {
  res.json(db.prepare("SELECT * FROM tags").all());
});

export default app;
