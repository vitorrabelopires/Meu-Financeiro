import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { neon } from "@neondatabase/serverless";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database initialization
let sql: any = null;
let db: any = null;
let tablesCreated: string[] = [];

if (process.env.POSTGRES_URL) {
  sql = neon(process.env.POSTGRES_URL);
  // Initialize Postgres tables
  const initPostgres = async () => {
    try {
      const tables = ['transactions', 'categories', 'accounts', 'credit_cards', 'tags', 'notification_settings'];
      for (const table of tables) {
        // Check if table exists
        const exists = await sql`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = ${table})`;
        if (!exists[0].exists) {
          if (table === 'transactions') await sql`CREATE TABLE transactions (id TEXT PRIMARY KEY, description TEXT, amount REAL, date TEXT, category TEXT, type TEXT, accountId TEXT, tags TEXT, creditCardId TEXT, userId TEXT, importId TEXT, importDate TEXT)`;
          if (table === 'categories') await sql`CREATE TABLE categories (id TEXT PRIMARY KEY, name TEXT, icon TEXT, color TEXT, type TEXT, userId TEXT)`;
          if (table === 'accounts') await sql`CREATE TABLE accounts (id TEXT PRIMARY KEY, name TEXT, balance REAL, color TEXT, icon TEXT, userId TEXT)`;
          if (table === 'credit_cards') await sql`CREATE TABLE credit_cards (id TEXT PRIMARY KEY, name TEXT, brand TEXT, bank TEXT, limit_val REAL, closingDay INTEGER, dueDay INTEGER, color TEXT, userId TEXT)`;
          if (table === 'tags') await sql`CREATE TABLE tags (id TEXT PRIMARY KEY, name TEXT, color TEXT, userId TEXT)`;
          if (table === 'notification_settings') await sql`CREATE TABLE notification_settings (userId TEXT PRIMARY KEY, cardDueReminders BOOLEAN, transactionReminders BOOLEAN, reminderTime TEXT, daysBeforeDue INTEGER)`;
          tablesCreated.push(table);
        }
      }
    } catch (e) {
      console.error("Postgres initialization error:", e);
    }
  };
  initPostgres();
} else {
  db = new Database("finance.db");
  const tables = [
    { name: 'transactions', schema: 'id TEXT PRIMARY KEY, description TEXT, amount REAL, date TEXT, category TEXT, type TEXT, accountId TEXT, tags TEXT, creditCardId TEXT, userId TEXT, importId TEXT, importDate TEXT' },
    { name: 'categories', schema: 'id TEXT PRIMARY KEY, name TEXT, icon TEXT, color TEXT, type TEXT, userId TEXT' },
    { name: 'accounts', schema: 'id TEXT PRIMARY KEY, name TEXT, balance REAL, color TEXT, icon TEXT, userId TEXT' },
    { name: 'credit_cards', schema: 'id TEXT PRIMARY KEY, name TEXT, brand TEXT, bank TEXT, limit_val REAL, closingDay INTEGER, dueDay INTEGER, color TEXT, userId TEXT' },
    { name: 'tags', schema: 'id TEXT PRIMARY KEY, name TEXT, color TEXT, userId TEXT' },
    { name: 'notification_settings', schema: 'userId TEXT PRIMARY KEY, cardDueReminders BOOLEAN, transactionReminders BOOLEAN, reminderTime TEXT, daysBeforeDue INTEGER' }
  ];

  tables.forEach(table => {
    const check = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table.name);
    if (!check) {
      db.exec(`CREATE TABLE ${table.name} (${table.schema})`);
      tablesCreated.push(table.name);
    }
  });
}

// Seed Defaults
const seedDefaults = async () => {
  if (sql) {
    try {
      const accountRows = await sql`SELECT COUNT(*) as count FROM accounts`;
      if (parseInt(accountRows[0].count) === 0) {
        await sql`INSERT INTO accounts (id, name, balance, color, icon) VALUES ('1', 'Carteira', 0, '#000000', 'Wallet')`;
        await sql`INSERT INTO accounts (id, name, balance, color, icon) VALUES ('2', 'Conta Corrente', 0, '#333333', 'Banknote')`;
      }
      const categoryRows = await sql`SELECT COUNT(*) as count FROM categories`;
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
    } catch (e) { console.error("Postgres seed error:", e); }
  } else {
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
  }
};
seedDefaults();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  app.get("/api/db-status", (req, res) => {
    res.json({ 
      status: "connected", 
      type: sql ? "postgres" : "sqlite",
      newTables: tablesCreated 
    });
  });

  // API Routes
  const getUserId = (req: any) => req.headers["x-user-id"];
  const isAdmin = (req: any) => req.headers["x-is-admin"] === "true";

  app.get("/api/transactions", async (req, res) => {
    const userId = getUserId(req);
    const admin = isAdmin(req);
    try {
      let rows;
      if (sql) {
        rows = admin ? await sql`SELECT * FROM transactions ORDER BY date DESC` : await sql`SELECT * FROM transactions WHERE userId = ${userId} ORDER BY date DESC`;
      } else {
        rows = admin ? db.prepare("SELECT * FROM transactions ORDER BY date DESC").all() : db.prepare("SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC").all(userId);
      }
      const transactions = rows.map((row: any) => ({
        ...row,
        tags: row.tags ? JSON.parse(row.tags) : []
      }));
      res.json(transactions);
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.post("/api/transactions", async (req, res) => {
    const t = req.body;
    const userId = getUserId(req);
    try {
      if (sql) {
        await sql`INSERT INTO transactions (id, description, amount, date, category, type, accountId, tags, creditCardId, userId, importId, importDate) VALUES (${t.id}, ${t.description}, ${t.amount}, ${t.date}, ${t.category}, ${t.type}, ${t.accountId}, ${JSON.stringify(t.tags || [])}, ${t.creditCardId}, ${userId}, ${t.importId}, ${t.importDate})`;
      } else {
        db.prepare("INSERT INTO transactions (id, description, amount, date, category, type, accountId, tags, creditCardId, userId, importId, importDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(t.id, t.description, t.amount, t.date, t.category, t.type, t.accountId, JSON.stringify(t.tags || []), t.creditCardId, userId, t.importId, t.importDate);
      }
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    const { id } = req.params;
    const t = req.body;
    const userId = getUserId(req);
    try {
      if (sql) {
        await sql`UPDATE transactions SET description = ${t.description}, amount = ${t.amount}, date = ${t.date}, category = ${t.category}, type = ${t.type}, accountId = ${t.accountId}, tags = ${JSON.stringify(t.tags || [])}, creditCardId = ${t.creditCardId} WHERE id = ${id} AND userId = ${userId}`;
      } else {
        db.prepare("UPDATE transactions SET description = ?, amount = ?, date = ?, category = ?, type = ?, accountId = ?, tags = ?, creditCardId = ? WHERE id = ? AND userId = ?").run(t.description, t.amount, t.date, t.category, t.type, t.accountId, JSON.stringify(t.tags || []), t.creditCardId, id, userId);
      }
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    const { id } = req.params;
    const userId = getUserId(req);
    try {
      if (sql) await sql`DELETE FROM transactions WHERE id = ${id} AND userId = ${userId}`;
      else db.prepare("DELETE FROM transactions WHERE id = ? AND userId = ?").run(id, userId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.get("/api/categories", async (req, res) => {
    const userId = getUserId(req);
    const admin = isAdmin(req);
    try {
      const rows = sql 
        ? (admin ? await sql`SELECT * FROM categories` : await sql`SELECT * FROM categories WHERE userId = ${userId} OR userId IS NULL`) 
        : (admin ? db.prepare("SELECT * FROM categories").all() : db.prepare("SELECT * FROM categories WHERE userId = ? OR userId IS NULL").all(userId));
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.post("/api/categories", async (req, res) => {
    const c = req.body;
    const userId = getUserId(req);
    try {
      if (sql) await sql`INSERT INTO categories (id, name, icon, color, type, userId) VALUES (${c.id}, ${c.name}, ${c.icon}, ${c.color}, ${c.type}, ${userId})`;
      else db.prepare("INSERT INTO categories (id, name, icon, color, type, userId) VALUES (?, ?, ?, ?, ?, ?)").run(c.id, c.name, c.icon, c.color, c.type, userId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.put("/api/categories/:id", async (req, res) => {
    const { id } = req.params;
    const c = req.body;
    const userId = getUserId(req);
    try {
      if (sql) await sql`UPDATE categories SET name = ${c.name}, icon = ${c.icon}, color = ${c.color}, type = ${c.type} WHERE id = ${id} AND userId = ${userId}`;
      else db.prepare("UPDATE categories SET name = ?, icon = ?, color = ?, type = ? WHERE id = ? AND userId = ?").run(c.name, c.icon, c.color, c.type, id, userId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    const { id } = req.params;
    const userId = getUserId(req);
    try {
      if (sql) await sql`DELETE FROM categories WHERE id = ${id} AND userId = ${userId}`;
      else db.prepare("DELETE FROM categories WHERE id = ? AND userId = ?").run(id, userId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.get("/api/accounts", async (req, res) => {
    const userId = getUserId(req);
    const admin = isAdmin(req);
    try {
      let rows;
      if (sql) {
        rows = admin ? await sql`SELECT * FROM accounts` : await sql`SELECT * FROM accounts WHERE userId = ${userId} OR userId IS NULL`;
        if (!admin && rows.length === 0) {
          await sql`INSERT INTO accounts (id, name, balance, color, icon, userId) VALUES (${'1_' + userId}, 'Carteira', 0, '#000000', 'Wallet', ${userId})`;
          await sql`INSERT INTO accounts (id, name, balance, color, icon, userId) VALUES (${'2_' + userId}, 'Conta Corrente', 0, '#333333', 'Banknote', ${userId})`;
          rows = await sql`SELECT * FROM accounts WHERE userId = ${userId}`;
        }
      } else {
        rows = admin ? db.prepare("SELECT * FROM accounts").all() : db.prepare("SELECT * FROM accounts WHERE userId = ? OR userId IS NULL").all(userId);
        if (!admin && rows.length === 0) {
          db.prepare("INSERT INTO accounts (id, name, balance, color, icon, userId) VALUES (?, ?, ?, ?, ?, ?)").run('1_' + userId, 'Carteira', 0, '#000000', 'Wallet', userId);
          db.prepare("INSERT INTO accounts (id, name, balance, color, icon, userId) VALUES (?, ?, ?, ?, ?, ?)").run('2_' + userId, 'Conta Corrente', 0, '#333333', 'Banknote', userId);
          rows = db.prepare("SELECT * FROM accounts WHERE userId = ?").all(userId);
        }
      }
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.post("/api/accounts", async (req, res) => {
    const a = req.body;
    const userId = getUserId(req);
    try {
      if (sql) await sql`INSERT INTO accounts (id, name, balance, color, icon, userId) VALUES (${a.id}, ${a.name}, ${a.balance}, ${a.color}, ${a.icon}, ${userId})`;
      else db.prepare("INSERT INTO accounts (id, name, balance, color, icon, userId) VALUES (?, ?, ?, ?, ?, ?)").run(a.id, a.name, a.balance, a.color, a.icon, userId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.put("/api/accounts/:id", async (req, res) => {
    const { id } = req.params;
    const a = req.body;
    const userId = getUserId(req);
    try {
      if (sql) {
        if (a.balance !== undefined && Object.keys(a).length === 1) {
          await sql`UPDATE accounts SET balance = ${a.balance} WHERE id = ${id} AND userId = ${userId}`;
        } else {
          await sql`UPDATE accounts SET name = ${a.name}, balance = ${a.balance}, color = ${a.color}, icon = ${a.icon} WHERE id = ${id} AND userId = ${userId}`;
        }
      } else {
        if (a.balance !== undefined && Object.keys(a).length === 1) {
          db.prepare("UPDATE accounts SET balance = ? WHERE id = ? AND userId = ?").run(a.balance, id, userId);
        } else {
          db.prepare("UPDATE accounts SET name = ?, balance = ?, color = ?, icon = ? WHERE id = ? AND userId = ?").run(a.name, a.balance, a.color, a.icon, id, userId);
        }
      }
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.delete("/api/accounts/:id", async (req, res) => {
    const { id } = req.params;
    const userId = getUserId(req);
    try {
      if (sql) await sql`DELETE FROM accounts WHERE id = ${id} AND userId = ${userId}`;
      else db.prepare("DELETE FROM accounts WHERE id = ? AND userId = ?").run(id, userId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.get("/api/notifications", async (req, res) => {
    const userId = getUserId(req);
    try {
      let rows;
      if (sql) {
        rows = await sql`SELECT * FROM notification_settings WHERE userId = ${userId}`;
        if (rows.length === 0) {
          const defaultSettings = { userId, cardDueReminders: true, transactionReminders: true, reminderTime: '09:00', daysBeforeDue: 2 };
          await sql`INSERT INTO notification_settings (userId, cardDueReminders, transactionReminders, reminderTime, daysBeforeDue) VALUES (${userId}, ${true}, ${true}, '09:00', 2)`;
          return res.json(defaultSettings);
        }
        res.json(rows[0]);
      } else {
        rows = db.prepare("SELECT * FROM notification_settings WHERE userId = ?").all(userId);
        if (rows.length === 0) {
          const defaultSettings = { userId, cardDueReminders: 1, transactionReminders: 1, reminderTime: '09:00', daysBeforeDue: 2 };
          db.prepare("INSERT INTO notification_settings (userId, cardDueReminders, transactionReminders, reminderTime, daysBeforeDue) VALUES (?, ?, ?, ?, ?)").run(userId, 1, 1, '09:00', 2);
          return res.json(defaultSettings);
        }
        res.json(rows[0]);
      }
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.put("/api/notifications", async (req, res) => {
    const s = req.body;
    const userId = getUserId(req);
    try {
      if (sql) await sql`UPDATE notification_settings SET cardDueReminders = ${s.cardDueReminders}, transactionReminders = ${s.transactionReminders}, reminderTime = ${s.reminderTime}, daysBeforeDue = ${s.daysBeforeDue} WHERE userId = ${userId}`;
      else db.prepare("UPDATE notification_settings SET cardDueReminders = ?, transactionReminders = ?, reminderTime = ?, daysBeforeDue = ? WHERE userId = ?").run(s.cardDueReminders ? 1 : 0, s.transactionReminders ? 1 : 0, s.reminderTime, s.daysBeforeDue, userId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.get("/api/credit-cards", async (req, res) => {
    const userId = getUserId(req);
    const admin = isAdmin(req);
    try {
      const rows = sql 
        ? (admin ? await sql`SELECT * FROM credit_cards` : await sql`SELECT * FROM credit_cards WHERE userId = ${userId}`) 
        : (admin ? db.prepare("SELECT * FROM credit_cards").all() : db.prepare("SELECT * FROM credit_cards WHERE userId = ?").all(userId));
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.post("/api/credit-cards", async (req, res) => {
    const c = req.body;
    const userId = getUserId(req);
    try {
      if (sql) await sql`INSERT INTO credit_cards (id, name, brand, bank, limit_val, closingDay, dueDay, color, userId) VALUES (${c.id}, ${c.name}, ${c.brand}, ${c.bank}, ${c.limit}, ${c.closingDay}, ${c.dueDay}, ${c.color}, ${userId})`;
      else db.prepare("INSERT INTO credit_cards (id, name, brand, bank, limit_val, closingDay, dueDay, color, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(c.id, c.name, c.brand, c.bank, c.limit, c.closingDay, c.dueDay, c.color, userId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.put("/api/credit-cards/:id", async (req, res) => {
    const { id } = req.params;
    const c = req.body;
    const userId = getUserId(req);
    try {
      if (sql) await sql`UPDATE credit_cards SET name = ${c.name}, brand = ${c.brand}, bank = ${c.bank}, limit_val = ${c.limit}, closingDay = ${c.closingDay}, dueDay = ${c.dueDay}, color = ${c.color} WHERE id = ${id} AND userId = ${userId}`;
      else db.prepare("UPDATE credit_cards SET name = ?, brand = ?, bank = ?, limit_val = ?, closingDay = ?, dueDay = ?, color = ? WHERE id = ? AND userId = ?").run(c.name, c.brand, c.bank, c.limit, c.closingDay, c.dueDay, c.color, id, userId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.delete("/api/credit-cards/:id", async (req, res) => {
    const { id } = req.params;
    const userId = getUserId(req);
    try {
      if (sql) await sql`DELETE FROM credit_cards WHERE id = ${id} AND userId = ${userId}`;
      else db.prepare("DELETE FROM credit_cards WHERE id = ? AND userId = ?").run(id, userId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.get("/api/tags", async (req, res) => {
    const userId = getUserId(req);
    const admin = isAdmin(req);
    try {
      const rows = sql 
        ? (admin ? await sql`SELECT * FROM tags` : await sql`SELECT * FROM tags WHERE userId = ${userId}`) 
        : (admin ? db.prepare("SELECT * FROM tags").all() : db.prepare("SELECT * FROM tags WHERE userId = ?").all(userId));
      res.json(rows);
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.post("/api/tags", async (req, res) => {
    const t = req.body;
    const userId = getUserId(req);
    try {
      if (sql) await sql`INSERT INTO tags (id, name, color, userId) VALUES (${t.id}, ${t.name}, ${t.color}, ${userId})`;
      else db.prepare("INSERT INTO tags (id, name, color, userId) VALUES (?, ?, ?, ?)").run(t.id, t.name, t.color, userId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.put("/api/tags/:id", async (req, res) => {
    const { id } = req.params;
    const t = req.body;
    const userId = getUserId(req);
    try {
      if (sql) await sql`UPDATE tags SET name = ${t.name}, color = ${t.color} WHERE id = ${id} AND userId = ${userId}`;
      else db.prepare("UPDATE tags SET name = ?, color = ? WHERE id = ? AND userId = ?").run(t.name, t.color, id, userId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  app.delete("/api/tags/:id", async (req, res) => {
    const { id } = req.params;
    const userId = getUserId(req);
    try {
      if (sql) await sql`DELETE FROM tags WHERE id = ${id} AND userId = ${userId}`;
      else db.prepare("DELETE FROM tags WHERE id = ? AND userId = ?").run(id, userId);
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e }); }
  });

  // 404 handler for API routes
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
