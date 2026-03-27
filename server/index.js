import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { uploadsRoot } from "./lib/productImageUpload.js";
import productsRouter from "./routes/products.js";
import usersRouter from "./routes/users.js";
import chatsRouter from "./routes/chats.js";
import ordersRouter from "./routes/orders.js";
import metaRouter from "./routes/meta.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsRoot));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);
app.use("/api/chats", chatsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api", metaRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

app.listen(PORT, () => {
  console.log(`Admin API listening on http://127.0.0.1:${PORT}`);
});
