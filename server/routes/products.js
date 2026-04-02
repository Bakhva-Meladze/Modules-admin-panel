import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { pool } from "../db.js";
import { parsePagination, paginationMeta } from "../lib/pagination.js";
import { uploadsRoot, withProductImage } from "../lib/productImageUpload.js";

const router = Router();

function parseAttributes(body) {
  const raw = body.attributes;
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(raw) ? raw : [];
}

function normalizeStoredImageValue(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const stripped = value.replace(/^\/+uploads\/+/i, "");
  const base = path.basename(stripped);
  if (!base || base === "." || base === "..") return "";
  return base;
}

function resolveImageUrl(req) {
  if (req.file) {
    return req.file.filename;
  }
  return normalizeStoredImageValue(req.body && req.body.image_url);
}

async function removeStoredUpload(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return;
  const base = path.basename(String(imageUrl).replace(/\\/g, "/"));
  if (!base || base === "." || base === "..") return;
  const root = path.resolve(uploadsRoot);
  const full = path.resolve(path.join(uploadsRoot, base));
  if (!full.startsWith(root + path.sep) && full !== root) return;
  try {
    await fs.unlink(full);
  } catch {}
}

router.get("/", async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM products`);
    const [rows] = await pool.query(
      `SELECT p.id, p.name, p.price, p.stock, p.category_id, p.image_url,
              c.name_eng AS category_name
       FROM products p
       LEFT JOIN category c ON c.id = p.category_id
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    res.json({ items: rows, ...paginationMeta(total, page, limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load products" });
  }
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid id" });
  }
  try {
    const [[product]] = await pool.query(
      `SELECT p.*, c.name_eng AS category_name
       FROM products p
       LEFT JOIN category c ON c.id = p.category_id
       WHERE p.id = ?`,
      [id]
    );
    if (!product) return res.status(404).json({ error: "Not found" });

    const [attrs] = await pool.query(
      `SELECT pa.id, pa.attribute_id, pa.attribute_value, a.name AS attribute_name
       FROM product_attributes pa
       LEFT JOIN attributes a ON a.id = pa.attribute_id
       WHERE pa.product_id = ?`,
      [id]
    );
    res.json({ ...product, attributes: attrs });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load product" });
  }
});

router.post(
  "/",
  withProductImage(async (req, res) => {
    const b = req.body || {};
    const { name, description_eng, description_geo } = b;
    const catId = Number(b.category_id);
    const p = Number(b.price);
    const s = Number(b.stock);
    const attributes = parseAttributes(b);

    if (!name || description_eng == null || description_geo == null) {
      return res.status(400).json({ error: "name, description_eng, description_geo required" });
    }
    if (!Number.isInteger(catId) || catId < 1 || !Number.isFinite(p) || !Number.isInteger(s)) {
      return res.status(400).json({ error: "Invalid price, stock, or category_id" });
    }

    const img = resolveImageUrl(req);
    if (!img) {
      return res.status(400).json({ error: "Product image file is required" });
    }
    if (img.length > 200) {
      return res.status(400).json({ error: "Image path too long for database" });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [r] = await conn.query(
        `INSERT INTO products (name, description_eng, description_geo, price, stock, category_id, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, description_eng, description_geo, p, s, catId, img]
      );
      const productId = r.insertId;

      for (const row of attributes) {
        const aid = Number(row.attribute_id);
        const val = row.attribute_value != null ? String(row.attribute_value) : "";
        if (!Number.isInteger(aid) || aid < 1) continue;
        await conn.query(
          `INSERT INTO product_attributes (product_id, attribute_id, attribute_value) VALUES (?, ?, ?)`,
          [productId, aid, val]
        );
      }

      await conn.commit();
      res.status(201).json({ id: productId });
    } catch (e) {
      await conn.rollback();
      if (req.file) await removeStoredUpload(req.file.filename);
      console.error(e);
      res.status(500).json({ error: "Failed to create product" });
    } finally {
      conn.release();
    }
  })
);

router.put(
  "/:id",
  withProductImage(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const b = req.body || {};
    const { name, description_eng, description_geo } = b;
    const catId = Number(b.category_id);
    const p = Number(b.price);
    const s = Number(b.stock);
    const attributes = parseAttributes(b);

    if (!name || description_eng == null || description_geo == null) {
      return res.status(400).json({ error: "name, description_eng, description_geo required" });
    }
    if (!Number.isInteger(catId) || catId < 1 || !Number.isFinite(p) || !Number.isInteger(s)) {
      return res.status(400).json({ error: "Invalid price, stock, or category_id" });
    }

    let img = resolveImageUrl(req);
    if (!img) {
      return res.status(400).json({ error: "Product image is missing; upload a file or keep the existing image" });
    }
    if (img.length > 200) {
      return res.status(400).json({ error: "Image path too long for database" });
    }

    const conn = await pool.getConnection();
    let previousImageUrl = null;
    try {
      await conn.beginTransaction();

      const [[existing]] = await conn.query(`SELECT image_url FROM products WHERE id = ?`, [id]);
      if (!existing) {
        await conn.rollback();
        if (req.file) await removeStoredUpload(req.file.filename);
        return res.status(404).json({ error: "Not found" });
      }
      previousImageUrl = existing.image_url;

      const [u] = await conn.query(
        `UPDATE products SET name=?, description_eng=?, description_geo=?, price=?, stock=?, category_id=?, image_url=?
         WHERE id=?`,
        [name, description_eng, description_geo, p, s, catId, img, id]
      );
      if (u.affectedRows === 0) {
        await conn.rollback();
        if (req.file) await removeStoredUpload(req.file.filename);
        return res.status(404).json({ error: "Not found" });
      }

      await conn.query(`DELETE FROM product_attributes WHERE product_id = ?`, [id]);
      for (const row of attributes) {
        const aid = Number(row.attribute_id);
        const val = row.attribute_value != null ? String(row.attribute_value) : "";
        if (!Number.isInteger(aid) || aid < 1) continue;
        await conn.query(
          `INSERT INTO product_attributes (product_id, attribute_id, attribute_value) VALUES (?, ?, ?)`,
          [id, aid, val]
        );
      }

      await conn.commit();

      if (req.file && previousImageUrl && previousImageUrl !== img) {
        await removeStoredUpload(previousImageUrl);
      }

      res.json({ ok: true });
    } catch (e) {
      await conn.rollback();
      if (req.file) await removeStoredUpload(req.file.filename);
      console.error(e);
      res.status(500).json({ error: "Failed to update product" });
    } finally {
      conn.release();
    }
  })
);

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[row]] = await conn.query(`SELECT image_url FROM products WHERE id = ?`, [id]);
    await conn.query(`DELETE FROM product_attributes WHERE product_id = ?`, [id]);
    const [d] = await conn.query(`DELETE FROM products WHERE id = ?`, [id]);
    await conn.commit();
    if (d.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    if (row && row.image_url) await removeStoredUpload(row.image_url);
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ error: "Failed to delete product" });
  } finally {
    conn.release();
  }
});

export default router;
