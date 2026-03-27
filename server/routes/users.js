import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { parsePagination, paginationMeta } from "../lib/pagination.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM registration`);
    const [rows] = await pool.query(
      `SELECT r.id, r.username, r.email
       FROM registration r
       ORDER BY r.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json({ items: rows, ...paginationMeta(total, page, limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load users" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid id" });
  }
  try {
    const [[reg]] = await pool.query(`SELECT id, username, email FROM registration WHERE id = ?`, [id]);
    if (!reg) return res.status(404).json({ error: "Not found" });
    const [[urow]] = await pool.query(
      `SELECT id, username, email, created_at, updated_at, user_id FROM users WHERE id = ? OR user_id = ? LIMIT 1`,
      [id, id]
    );
    res.json({ ...reg, app_user: urow || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load user" });
  }
});

router.post("/", async (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email, password required" });
  }
  const hash = bcrypt.hashSync(String(password), 10);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [ins] = await conn.query(
      `INSERT INTO registration (username, email, password, confirmPassword) VALUES (?, ?, ?, ?)`,
      [username, email, hash, hash]
    );
    const newId = ins.insertId;
    await conn.query(
      `INSERT INTO users (id, username, email, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [newId, username, email, newId]
    );
    await conn.commit();
    res.status(201).json({ id: newId });
  } catch (e) {
    await conn.rollback();
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email or username already exists" });
    }
    console.error(e);
    res.status(500).json({ error: "Failed to create user" });
  } finally {
    conn.release();
  }
});

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const { username, email, password } = req.body || {};
  if (!username || !email) {
    return res.status(400).json({ error: "username and email required" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let hashSql = "";
    const params = [username, email];
    if (password && String(password).length > 0) {
      const hash = bcrypt.hashSync(String(password), 10);
      hashSql = ", password = ?, confirmPassword = ?";
      params.push(hash, hash);
    }
    params.push(id);

    const [ur] = await conn.query(
      `UPDATE registration SET username = ?, email = ?${hashSql} WHERE id = ?`,
      params
    );
    if (ur.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: "Not found" });
    }

    await conn.query(`UPDATE users SET username = ?, email = ?, updated_at = NOW() WHERE id = ? OR user_id = ?`, [
      username,
      email,
      id,
      id,
    ]);

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email or username already exists" });
    }
    console.error(e);
    res.status(500).json({ error: "Failed to update user" });
  } finally {
    conn.release();
  }
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [chatRows] = await conn.query(`SELECT id FROM chats WHERE user_id = ?`, [id]);
    const chatIds = chatRows.map((c) => c.id);
    if (chatIds.length) {
      const placeholders = chatIds.map(() => "?").join(",");
      await conn.query(`DELETE FROM messages WHERE chat_id IN (${placeholders})`, chatIds);
      await conn.query(`DELETE FROM chats WHERE user_id = ?`, [id]);
    }

    await conn.query(`DELETE FROM orders WHERE user_id = ?`, [id]);
    await conn.query(`DELETE FROM users WHERE id = ? OR user_id = ?`, [id, id]);
    const [dr] = await conn.query(`DELETE FROM registration WHERE id = ?`, [id]);

    await conn.commit();
    if (dr.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: "Failed to delete user" });
  } finally {
    conn.release();
  }
});

export default router;
