# Modules admin panel

React (class components) + Node.js (Express) admin UI for the `modules` MySQL database.

## Features

- **Products:** list, detail, create, edit, delete (including `product_attributes` on save). New uploads are stored under `server/uploads/` and exposed at **`http://<api-host>:3001/uploads/<filename>`**; the DB field `image_url` stores **only the file name** (e.g. `<uuid>.webp`). The admin UI resolves that to `/uploads/<filename>` (or `VITE_IMAGE_URL_PREFIX` + `/uploads/...` if set). Legacy rows with `/uploads/...` still work.
- **Users:** list, detail, create, edit, delete. Data is stored in `registration`; the API keeps the `users` row in sync and uses bcrypt for passwords (compatible with Laravel-style hashes).
- **Chats:** list chat sessions and read messages per chat.
- **Orders:** paginated list and read-only detail (line items from stored JSON). Backed by MySQL `orders` (linked to `registration` / `user_id`).
- **Pagination:** product, user, and chat list APIs support `?page=1&limit=20` (default **20**, max **100**) and return JSON `{ items, total, page, limit, totalPages }`.

## Prerequisites

- MySQL with database `modules` (XAMPP is fine).
- Node.js 18+.

## Backend

```bash
cd server
copy .env.example .env   # or create .env — default matches root / empty password
npm install
npm run dev              # or npm start (no file watch)
```

API base: `http://127.0.0.1:3001`

## Frontend

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to the backend.

## Languages

The admin UI supports **English** and **Georgian** (ქართული). Use the **flag dropdown** in the **top-right** of the header; the choice is saved in the browser (`localStorage` key `admin_locale`).

## Security note

This panel has **no login**. Run it only on trusted networks or add authentication before exposing it publicly.
