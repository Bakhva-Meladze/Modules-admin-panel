import { Router } from "express";
import { pool } from "../db.js";
import { parsePagination, paginationMeta } from "../lib/pagination.js";

const router = Router();

const STATUS_VALUES = new Set(["cart", "placed", "shipped", "delivered", "cancelled"]);

function normalizeStatus(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "cart";
  return STATUS_VALUES.has(s) ? s : "—";
}

function parseOrderItems(raw) {
  if (raw == null || raw === "") return [];
  try {
    const p = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

router.get("/", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM orders`);
    const [rows] = await pool.query(
      `SELECT o.id, o.user_id, o.status, o.total_price, o.created_at, o.updated_at,
              r.username, r.email
       FROM orders o
       LEFT JOIN registration r ON r.id = o.user_id
       ORDER BY o.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const items = rows.map((row) => ({
      ...row,
      status: normalizeStatus(row.status),
    }));
    res.json({ items, ...paginationMeta(total, page, limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load orders" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid id" });
  }
  try {
    const [[row]] = await pool.query(
      `SELECT o.id, o.user_id, o.status, o.total_price, o.created_at, o.updated_at, o.items,
              r.username, r.email
       FROM orders o
       LEFT JOIN registration r ON r.id = o.user_id
       WHERE o.id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ error: "Not found" });
    const lineItems = parseOrderItems(row.items);
    res.json({
      id: row.id,
      user_id: row.user_id,
      status: normalizeStatus(row.status),
      total_price: row.total_price,
      created_at: row.created_at,
      updated_at: row.updated_at,
      username: row.username,
      email: row.email,
      line_items: lineItems,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load order" });
  }
});

export default router;
