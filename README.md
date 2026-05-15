# 🛒 Vine's Store — Inventory Management System

A full-featured grocery inventory management web application built with **Next.js 15**, **Prisma**, **PostgreSQL**, and **NextAuth.js**.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 Role-based auth | Admin (full access) · Staff (POS + stock) |
| 📦 Product Management | Add, edit, delete with expiry & threshold tracking |
| 📊 Stock Monitoring | Record Stock In / Stock Out with movement history |
| 🚨 Smart Alerts | Auto-detect low stock, near expiry, expired items |
| 🛒 POS / Sales | Full point-of-sale with cart, payment, receipt |
| 📈 Reports | Sales, Inventory, Profit, Product Movement with Recharts |
| 🏪 Supplier Portal | Purchase orders & demand trends (scaffold) |
| ⚙️ Settings | Profile, store config, security, notifications |

---

## 🗂️ Project Structure

```
vines-store/
├── app/
│   ├── login/                  # Login page (Figure 1 in PDF)
│   ├── dashboard/
│   │   ├── admin/              # Admin-only routes
│   │   │   ├── page.tsx        # Admin dashboard (Figures 2–3)
│   │   │   ├── products/       # Product management + CRUD modal
│   │   │   ├── stock/          # Stock monitoring
│   │   │   ├── alerts/         # Three-section alerts page
│   │   │   ├── pos/            # POS/Sales
│   │   │   ├── reports/        # 4-tab reports with Recharts
│   │   │   ├── suppliers/      # Supplier portal
│   │   │   └── settings/       # Settings page
│   │   └── staff/              # Staff-only routes (POS, stock, alerts)
│   ├── api/auth/               # NextAuth endpoint
│   └── globals.css             # Design system + responsive styles
├── components/
│   ├── ui/                     # Sidebar, topbar, shared UI
│   ├── dashboard/              # Stat cards, product panels
│   ├── products/               # ProductManagementClient
│   ├── stock/                  # StockMonitoringClient
│   ├── alerts/                 # AlertsClient
│   ├── pos/                    # POSClient
│   ├── reports/                # ReportsClient
│   └── settings/               # SettingsClient
├── lib/
│   ├── auth.ts                 # NextAuth config (hardcoded + DB users)
│   ├── prisma.ts               # Prisma client singleton
│   ├── pos-data.ts             # Shared POS data loader
│   └── actions/                # Server Actions (products, stock, alerts, pos)
├── prisma/
│   ├── schema.prisma           # Full DB schema
│   └── seed.ts                 # Grocery seed data
├── middleware.ts               # Role-based route protection
└── types/next-auth.d.ts        # TypeScript augmentation
```

---

## 🚀 Quick Start (Local)

### Prerequisites

- **Node.js** 18+ — [nodejs.org](https://nodejs.org)
- **npm** 9+ (comes with Node)
- **PostgreSQL** database (local or [Neon](https://neon.tech) free tier)

### 1. Clone & install

```bash
git clone https://github.com/your-username/vines-store.git
cd vines-store
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
# Your PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/vines_store"

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-super-secret-key-here"

NEXTAUTH_URL="http://localhost:3000"
```

### 3. Push the database schema

```bash
npm run db:push
```

> This creates all tables without creating migration files (good for development).
> For production, use `npm run db:migrate` instead.

### 4. Seed sample data

```bash
npm run db:seed
```

This seeds:
- 9 product categories
- 12 grocery products (Fresh Milk, White Bread, Eggs, Rice, etc.)
- Sale records with quantities matching the PDF screenshots
- Stock movement history
- 3 active alerts (2 low stock, 1 near expiry)
- Admin and Staff users

**Demo credentials:**

| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | admin@vine.com     | `password` |
| Staff | staff@vine.com     | `password` |

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

---

## 🗄️ Database Commands

| Command              | Description                                      |
|----------------------|--------------------------------------------------|
| `npm run db:push`    | Sync schema to DB (no migration history)         |
| `npm run db:migrate` | Create & run a migration file                    |
| `npm run db:seed`    | Seed grocery data (safe to re-run)               |
| `npm run db:reset`   | Drop all tables, re-push schema, and re-seed     |
| `npm run db:studio`  | Open Prisma Studio (visual DB browser)           |

---

## ☁️ Deploy to Vercel + Neon (Production)

### Step 1 — Create a Neon database

1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Click **"New Project"**.
3. Name it `vines-store`, choose **Singapore** (or your nearest region).
4. Click **"Create Project"**.
5. Copy the **connection string** — it looks like:
   ```
   postgresql://USER:PASSWORD@ep-xxx.ap-southeast-1.aws.neon.tech/vines_store?sslmode=require
   ```

### Step 2 — Deploy to Vercel

#### Option A — GitHub (Recommended)

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/vines-store.git
   git push -u origin main
   ```

2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo.

3. In the **Environment Variables** section, add:

   | Key              | Value                                    |
   |------------------|------------------------------------------|
   | `DATABASE_URL`   | Your Neon connection string              |
   | `NEXTAUTH_SECRET`| Run `openssl rand -base64 32` locally    |
   | `NEXTAUTH_URL`   | `https://your-app.vercel.app`            |

4. Click **Deploy**. Vercel auto-detects Next.js.

#### Option B — Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login and link project
vercel login
vercel

# Add environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Deploy to production
vercel --prod
```

### Step 3 — Run migrations and seed on Neon

After deploying, run these once to set up the production database:

```bash
# Push schema to Neon (uses DATABASE_URL from .env)
DATABASE_URL="your-neon-connection-string" npm run db:push

# Seed the production database
DATABASE_URL="your-neon-connection-string" npm run db:seed
```

> ⚠️ **Important:** After seeding, change the passwords in `prisma/seed.ts` to something strong, or implement a password reset flow before going live.

### Step 4 — Verify

Visit `https://your-app.vercel.app/login` and sign in with:
- `admin@vine.com` / `password`
- `staff@vine.com` / `password`

---

## 🔧 Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Framework     | Next.js 15 (App Router)           |
| Language      | TypeScript                        |
| Styling       | Tailwind CSS + custom design system |
| Database      | PostgreSQL (Neon)                 |
| ORM           | Prisma 5                          |
| Auth          | NextAuth.js v4 (JWT)              |
| Charts        | Recharts                          |
| Icons         | Lucide React                      |
| Font          | DM Sans + DM Mono (Google Fonts)  |
| Deployment    | Vercel                            |

---

## 🎨 Design System

The app uses a custom green-accented design system (CSS custom properties):

| Token                  | Value      | Usage                        |
|------------------------|------------|------------------------------|
| `--brand-600`          | `#16a34a`  | Primary buttons, active nav  |
| `--brand-700`          | `#15803d`  | Hover states                 |
| `--sidebar-bg`         | `#0f172a`  | Dark sidebar                 |
| `--background`         | `#f8fafc`  | Page background              |
| `--surface`            | `#ffffff`  | Card backgrounds             |
| `--border`             | `#e2e8f0`  | All borders                  |

---

## 🧩 Adding New Pages

1. Create the route file: `app/dashboard/admin/new-page/page.tsx`
2. Add it to the sidebar: `components/ui/admin-sidebar.tsx` → `NAV_ITEMS`
3. Add the topbar title mapping: `components/ui/admin-topbar-injector.tsx` → `ROUTE_TITLES`
4. Protect it in middleware: `middleware.ts` already covers all `/dashboard/admin/**`

---

## 🔐 Authentication

Two hardcoded users are in `lib/auth.ts` (no DB needed for auth):

```ts
{ email: "admin@vine.com", password: "password", role: "ADMIN" }
{ email: "staff@vine.com", password: "password", role: "STAFF" }
```

**To switch to DB-backed auth** (for production with multiple users):
1. Uncomment the Prisma user lookup in `lib/auth.ts`
2. Hash passwords using `bcryptjs`
3. Run `npm run db:seed` to create users with hashed passwords

---

## 🗺️ Route Map

| URL | Role | Page |
|-----|------|------|
| `/login` | Public | Login page |
| `/dashboard/admin` | ADMIN | Admin dashboard |
| `/dashboard/admin/products` | ADMIN | Product management |
| `/dashboard/admin/stock` | ADMIN | Stock monitoring |
| `/dashboard/admin/alerts` | ADMIN | Alerts |
| `/dashboard/admin/pos` | ADMIN | POS/Sales |
| `/dashboard/admin/reports` | ADMIN | Reports |
| `/dashboard/admin/suppliers` | ADMIN | Supplier portal |
| `/dashboard/admin/settings` | ADMIN | Settings |
| `/dashboard/staff` | STAFF | Staff dashboard |
| `/dashboard/staff/pos` | STAFF | POS/Sales |
| `/dashboard/staff/stock` | STAFF | Stock monitoring |
| `/dashboard/staff/alerts` | STAFF | Alerts |

---

## 🐛 Troubleshooting

**`Error: Cannot find module '@prisma/client'`**
```bash
npm run postinstall   # or: npx prisma generate
```

**`PrismaClientInitializationError`**
- Check `DATABASE_URL` is correct in `.env`
- Ensure your PostgreSQL server is running
- For Neon: verify the connection string includes `?sslmode=require`

**`[next-auth] error ... NEXTAUTH_URL`**
- Set `NEXTAUTH_URL=http://localhost:3000` in `.env`
- On Vercel this is set automatically

**Charts not rendering**
- Recharts requires client-side rendering — all chart components use `"use client"`
- Ensure `recharts` is in `dependencies` (not devDependencies)

**Seed fails on re-run**
- The seed uses `upsert` for products and users, so it's idempotent
- If you get unique constraint errors on alerts, run `npm run db:reset`

---

## 📄 License

MIT — free to use for academic and commercial projects.

---

## 👨‍💻 Built for

**Pamantasan ng Lungsod ng Valenzuela** — Information Technology Department  
BSIT 2-6 · Systems Analysis and Design Project  
**Vine's Store** — Grocery Inventory Management System
