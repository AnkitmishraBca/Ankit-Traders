# Ankit Traders Billing — deployment guide

Two ways to run this app. Both are 100% self-contained, so no sandbox link is needed.

## 1. Single-file app (recommended for permanent hosting)

File: **`public/standalone/ankit-traders-billing.html`**

* All HTML + CSS + JS is in one file (logo and your doctors/medicines/invoice/collection entries are embedded).
* No server, no database, no build step. Data is stored in the browser (`localStorage`).
* Print + PDF + JPG: **A5 (148 × 210 mm)**, print margins **10 mm**, export `html2canvas scale: 3` (≈300 DPI).

### GitHub Pages
1. Create a repository, upload `ankit-traders-billing.html` as `index.html`.
2. Settings → Pages → Branch `main` → `/ (root)` → Save.
3. Open `https://<user>.github.io/<repo>/`.

### Netlify
1. Drag the folder containing the file (renamed to `index.html`) onto <https://app.netlify.com/drop>.
2. Done — the generated URL is permanent.

### Vercel
1. `vercel deploy` a folder containing `index.html` (or import the repo in the dashboard).
2. Framework preset: **Other**, output directory: the folder with `index.html`.

### Local / pendrive
Open the file directly in Chrome, or use Android Chrome → **⋮ → Add to Home screen** after hosting it.

> **Backups:** the sidebar has **Backup JSON** (export all entries) and **Restore JSON** (import on another device).
> **Downloading the file:** the app sidebar has a **Download single-file app** button; inside the file use **Save app file**.

## 2. Next.js + PostgreSQL version (this repository)

```bash
npm install
npm run build
npm start          # http://localhost:3000
```

* `DATABASE_URL` is read from `.env`; `npx drizzle-kit push` creates the tables.
* On first start the existing Ankit Traders records are restored automatically if the database is empty.
* Deploy to Vercel/Netlify by connecting the repository and setting `DATABASE_URL` (Neon/Supabase/Railway).

Rebuild the single-file app after any change:

```bash
node scripts/build-standalone.mjs
```
