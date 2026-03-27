import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

router.get("/categories", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name_eng, name_geo, identifier, ordering FROM category ORDER BY ordering ASC, id ASC`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load categories" });
  }
});

router.get("/attributes", async (_req, res) => {
  try {
    const [rows] = await pool.query(`SELECT id, name FROM attributes ORDER BY id ASC`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load attributes" });
  }
});

export default router;
