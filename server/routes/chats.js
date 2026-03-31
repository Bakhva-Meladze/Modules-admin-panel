import { Router } from "express";
import { pool } from "../db.js";
import { parsePagination, paginationMeta } from "../lib/pagination.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM chats`);
    const [rows] = await pool.query(
      `SELECT c.id, c.user_id, c.session_id, c.created_at,
              u.username, u.email,
              (SELECT COUNT(*) FROM messages m WHERE m.chat_id = c.id) AS message_count
       FROM chats c
       LEFT JOIN users u ON u.id = c.user_id
       ORDER BY c.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json({ items: rows, ...paginationMeta(total, page, limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load chats" });
  }
});

router.get("/:chatId/messages", async (req, res) => {
  const chatId = Number(req.params.chatId);
  if (!Number.isInteger(chatId) || chatId < 1) {
    return res.status(400).json({ error: "Invalid chat id" });
  }
  try {
    const [[chat]] = await pool.query(
      `SELECT c.*, u.username, u.email
       FROM chats c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`,
      [chatId]
    );
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const [messages] = await pool.query(
      `SELECT id, email, user_id, text, sender, created_at, chat_id
       FROM messages
       WHERE chat_id = ?
       ORDER BY created_at ASC, id ASC`,
      [chatId]
    );
    res.json({ chat, messages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

router.post("/:chatId/messages", async (req, res) => {
  const chatId = Number(req.params.chatId);
  const body = req.body;
  const text = body && body.text != null ? String(body.text).trim() : "";
  if (!Number.isInteger(chatId) || chatId < 1) {
    return res.status(400).json({ error: "Invalid chat id" });
  }
  if (!text) {
    return res.status(400).json({ error: "Message text is required" });
  }

  try {
    const [[chat]] = await pool.query(`SELECT id, user_id FROM chats WHERE id = ?`, [chatId]);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const [ins] = await pool.query(
      `INSERT INTO messages (email, user_id, text, sender, chat_id, created_at)
       VALUES ('', ?, ?, 'admin', ?, NOW())`,
      [chat.user_id, text, chatId]
    );

    const [[msg]] = await pool.query(
      `SELECT id, email, user_id, text, sender, created_at, chat_id FROM messages WHERE id = ?`,
      [ins.insertId]
    );
    res.status(201).json(msg);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
