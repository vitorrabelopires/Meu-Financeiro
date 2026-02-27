import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("finance.db");

// Initialize Database
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
    id TEXT PRIMARY KEY,
    name TEXT,
    icon TEXT,
    color TEXT,
    type TEXT
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT,
    balance REAL,
    color TEXT,
    icon TEXT
  );

  CREATE TABLE IF NOT EXISTS credit_cards (
    id TEXT PRIMARY KEY,
    name TEXT,
    brand TEXT,
    bank TEXT,
    limit_val REAL,
    closingDay INTEGER,
    dueDay INTEGER,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT,
    color TEXT
  );
`);

// Seed Defaults
const seedDefaults = () => {
  const accountCount = db.prepare("SELECT COUNT(*) as count FROM accounts").get() as any;
  if (accountCount.count === 0) {
    db.prepare("INSERT INTO accounts (id, name, balance, color, icon) VALUES (?, ?, ?, ?, ?)")
      .run('1', 'Carteira', 0, '#000000', 'Wallet');
    db.prepare("INSERT INTO accounts (id, name, balance, color, icon) VALUES (?, ?, ?, ?, ?)")
      .run('2', 'Conta Corrente', 0, '#333333', 'Banknote');
  }

  const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as any;
  if (categoryCount.count === 0) {
    const defaults = [
      { id: 'c1', name: 'Alimentação', icon: 'Utensils', color: '#f59e0b', type: 'expense' },
      { id: 'c2', name: 'Transporte', icon: 'Car', color: '#3b82f6', type: 'expense' },
      { id: 'c3', name: 'Lazer', icon: 'Gamepad2', color: '#8b5cf6', type: 'expense' },
      { id: 'c4', name: 'Saúde', icon: 'HeartPulse', color: '#ef4444', type: 'expense' },
      { id: 'c5', name: 'Salário', icon: 'DollarSign', color: '#10b981', type: 'income' },
      { id: 'c6', name: 'Investimentos', icon: 'TrendingUp', color: '#000000', type: 'income' },
    ];
    const stmt = db.prepare("INSERT INTO categories (id, name, icon, color, type) VALUES (?, ?, ?, ?, ?)");
    defaults.forEach(c => stmt.run(c.id, c.name, c.icon, c.color, c.type));
  }
};
seedDefaults();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
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

  // Categories
  app.get("/api/categories", (req, res) => {
    res.json(db.prepare("SELECT * FROM categories").all());
  });

  app.post("/api/categories", (req, res) => {
    const c = req.body;
    db.prepare("INSERT INTO categories (id, name, icon, color, type) VALUES (?, ?, ?, ?, ?)")
      .run(c.id, c.name, c.icon, c.color, c.type);
    res.json({ success: true });
  });

  // Accounts
  app.get("/api/accounts", (req, res) => {
    res.json(db.prepare("SELECT * FROM accounts").all());
  });

  app.put("/api/accounts/:id", (req, res) => {
    const { id } = req.params;
    const { balance } = req.body;
    db.prepare("UPDATE accounts SET balance = ? WHERE id = ?").run(balance, id);
    res.json({ success: true });
  });

  // Credit Cards
  app.get("/api/credit-cards", (req, res) => {
    res.json(db.prepare("SELECT * FROM credit_cards").all());
  });

  // Tags
  app.get("/api/tags", (req, res) => {
    res.json(db.prepare("SELECT * FROM tags").all());
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
