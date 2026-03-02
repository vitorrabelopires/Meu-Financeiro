import express from "express";
import { neon } from "@neondatabase/serverless";

const app = express();
app.use(express.json());

const sql = process.env.POSTGRES_URL ? neon(process.env.POSTGRES_URL) : null;

// API Routes
const getUserId = (req: any) => req.headers["x-user-id"];
const isAdmin = (req: any) => req.headers["x-is-admin"] === "true";

app.get("/api/transactions", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const userId = getUserId(req);
  const admin = isAdmin(req);
  try {
    const rows = admin 
      ? await sql`SELECT * FROM transactions ORDER BY date DESC` 
      : await sql`SELECT * FROM transactions WHERE userId = ${userId} ORDER BY date DESC`;
    const transactions = rows.map((row: any) => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    }));
    res.json(transactions);
  } catch (e) { res.status(500).json({ error: e }); }
});

app.post("/api/transactions", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const t = req.body;
  const userId = getUserId(req);
  try {
    await sql`INSERT INTO transactions (id, description, amount, date, category, type, accountId, tags, creditCardId, userId) VALUES (${t.id}, ${t.description}, ${t.amount}, ${t.date}, ${t.category}, ${t.type}, ${t.accountId}, ${JSON.stringify(t.tags || [])}, ${t.creditCardId}, ${userId})`;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e }); }
});

app.put("/api/transactions/:id", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const { id } = req.params;
  const t = req.body;
  const userId = getUserId(req);
  try {
    await sql`UPDATE transactions SET description = ${t.description}, amount = ${t.amount}, date = ${t.date}, category = ${t.category}, type = ${t.type}, accountId = ${t.accountId}, tags = ${JSON.stringify(t.tags || [])}, creditCardId = ${t.creditCardId} WHERE id = ${id} AND userId = ${userId}`;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e }); }
});

app.delete("/api/transactions/:id", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const { id } = req.params;
  const userId = getUserId(req);
  try {
    await sql`DELETE FROM transactions WHERE id = ${id} AND userId = ${userId}`;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e }); }
});

app.get("/api/categories", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const userId = getUserId(req);
  const admin = isAdmin(req);
  try {
    const rows = admin 
      ? await sql`SELECT * FROM categories` 
      : await sql`SELECT * FROM categories WHERE userId = ${userId} OR userId IS NULL`;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e }); }
});

app.post("/api/categories", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const c = req.body;
  const userId = getUserId(req);
  try {
    await sql`INSERT INTO categories (id, name, icon, color, type, userId) VALUES (${c.id}, ${c.name}, ${c.icon}, ${c.color}, ${c.type}, ${userId})`;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e }); }
});

app.get("/api/accounts", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const userId = getUserId(req);
  const admin = isAdmin(req);
  try {
    const rows = admin 
      ? await sql`SELECT * FROM accounts` 
      : await sql`SELECT * FROM accounts WHERE userId = ${userId} OR userId IS NULL`;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e }); }
});

app.put("/api/accounts/:id", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const { id } = req.params;
  const { balance } = req.body;
  const userId = getUserId(req);
  try {
    await sql`UPDATE accounts SET balance = ${balance} WHERE id = ${id} AND userId = ${userId}`;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e }); }
});

app.get("/api/credit-cards", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const userId = getUserId(req);
  const admin = isAdmin(req);
  try {
    const rows = admin 
      ? await sql`SELECT * FROM credit_cards` 
      : await sql`SELECT * FROM credit_cards WHERE userId = ${userId}`;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e }); }
});

app.get("/api/tags", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const userId = getUserId(req);
  const admin = isAdmin(req);
  try {
    const rows = admin 
      ? await sql`SELECT * FROM tags` 
      : await sql`SELECT * FROM tags WHERE userId = ${userId}`;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e }); }
});

export default app;
