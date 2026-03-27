import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsRoot = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "") || ".jpg";
    const safe = /^\.[a-z0-9]{1,8}$/i.test(ext) ? ext.toLowerCase() : ".jpg";
    cb(null, `${crypto.randomUUID()}${safe}`);
  },
});

export const uploadProductImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype || "");
    if (ok) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"));
  },
});

export function handleMulterError(err, res) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "Image must be 5 MB or smaller" });
      return true;
    }
    res.status(400).json({ error: err.message });
    return true;
  }
  if (err) {
    res.status(400).json({ error: err.message || "Upload failed" });
    return true;
  }
  return false;
}

export function withProductImage(handler) {
  return (req, res) => {
    uploadProductImage.single("image")(req, res, (err) => {
      if (handleMulterError(err, res)) return;
      Promise.resolve(handler(req, res)).catch((e) => {
        console.error(e);
        if (!res.headersSent) res.status(500).json({ error: "Failed to save product" });
      });
    });
  };
}
