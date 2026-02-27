import express from "express";
import { neon } from "@neondatabase/serverless";

const app = express();
app.use(express.json());

const sql = process.env.POSTGRES_URL ? neon(process.env.POSTGRES_URL) : null;

// API Routes
app.get("/api/transactions", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  try {
    const rows = await sql`SELECT * FROM transactions ORDER BY date DESC`;
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
  try {
    await sql`INSERT INTO transactions (id, description, amount, date, category, type, accountId, tags, creditCardId) VALUES (${t.id}, ${t.description}, ${t.amount}, ${t.date}, ${t.category}, ${t.type}, ${t.accountId}, ${JSON.stringify(t.tags || [])}, ${t.creditCardId})`;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e }); }
});

app.put("/api/transactions/:id", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const { id } = req.params;
  const t = req.body;
  try {
    await sql`UPDATE transactions SET description = ${t.description}, amount = ${t.amount}, date = ${t.date}, category = ${t.category}, type = ${t.type}, accountId = ${t.accountId}, tags = ${JSON.stringify(t.tags || [])}, creditCardId = ${t.creditCardId} WHERE id = ${id}`;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e }); }
});

app.delete("/api/transactions/:id", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const { id } = req.params;
  try {
    await sql`DELETE FROM transactions WHERE id = ${id}`;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e }); }
});

app.get("/api/categories", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  try {
    const rows = await sql`SELECT * FROM categories`;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e }); }
});

app.post("/api/categories", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const c = req.body;
  try {
    await sql`INSERT INTO categories (id, name, icon, color, type) VALUES (${c.id}, ${c.name}, ${c.icon}, ${c.color}, ${c.type})`;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e }); }
});

app.get("/api/accounts", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  try {
    const rows = await sql`SELECT * FROM accounts`;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e }); }
});

app.put("/api/accounts/:id", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  const { id } = req.params;
  const { balance } = req.body;
  try {
    await sql`UPDATE accounts SET balance = ${balance} WHERE id = ${id}`;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e }); }
});

app.get("/api/credit-cards", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  try {
    const rows = await sql`SELECT * FROM credit_cards`;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e }); }
});

app.get("/api/tags", async (req, res) => {
  if (!sql) return res.status(500).json({ error: "POSTGRES_URL not configured" });
  try {
    const rows = await sql`SELECT * FROM tags`;
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e }); }
});

export default app;
