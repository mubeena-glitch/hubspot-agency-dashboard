# HubSpot Agency Dashboard

> Production-ready internal dashboard for managing HubSpot account handovers, team transitions, and vacation delegation.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Database | PostgreSQL via Prisma ORM |
| Auth | NextAuth v4 (JWT + credentials) |
| UI | Tailwind CSS + Radix UI primitives |
| Hosting | Vercel |
| Language | TypeScript (strict) |

---

## Features

- **Role-based access**: Admin / Team Lead / Developer / Designer
- **HubSpot Account registry** with full technical metadata
- **Structured handover system** with progress tracking, Loom links, deployment docs
- **Vacation delegation module** with per-account coverage notes
- **Risk dashboard** (admin only) — accounts without backup, expired AMC, missing handovers
- **Task tracker** per account with priority + status
- **CSV export** of all accounts
- **Masked credentials** for access details (admin-only)
- **Activity timeline** for handover sessions (calls, huddles, walkthroughs)

---

## Project Structure

```
hubspot-dashboard/
├── prisma/
│   ├── schema.prisma          # Full data model (10 models)
│   └── seed.ts                # Sample data (6 users, 6 accounts, handovers, tasks)
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Protected route group
│   │   │   ├── page.tsx           # Dashboard home
│   │   │   ├── accounts/          # Account list + detail + edit + new
│   │   │   ├── handovers/         # Handover tracker
│   │   │   ├── vacation/          # Vacation plans
│   │   │   ├── risks/             # Risk dashboard (admin)
│   │   │   └── team/              # Team overview
│   │   ├── api/
│   │   │   ├── auth/[...nextauth] # NextAuth handler
│   │   │   ├── accounts/          # CRUD + export
│   │   │   ├── handovers/         # Handover CRUD + activities
│   │   │   ├── tasks/             # Task management
│   │   │   ├── vacation/          # Vacation plans
│   │   │   ├── integrations/      # Integration management
│   │   │   ├── risks/             # Risk aggregation
│   │   │   ├── team/              # User management
│   │   │   └── export/accounts/   # CSV export
│   │   └── auth/signin/       # Login page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Providers.tsx      # SessionProvider wrapper
│   │   │   ├── Sidebar.tsx        # Navigation sidebar
│   │   │   └── TopBar.tsx         # Header with search
│   │   └── modules/
│   │       ├── AccountFilters.tsx # Search + filter bar
│   │       ├── AccountForm.tsx    # Create/edit account form
│   │       └── VacationForm.tsx   # Create vacation plan form
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── utils.ts           # Formatters + status configs
│   │   └── permissions.ts     # Role-based permission helpers
│   └── middleware.ts          # Route protection
```

---

## Data Models

```
User ──< Account (owner)
User ──< Account (shadow)
Account ──1 Handover
Handover ──< HandoverActivity
Account ──< Task
Account ──< Integration
Account ──< AccessDetail (admin-only)
Account ──< AccountAssignment (many-to-many)
User ──< VacationPlan
VacationPlan ──< VacationAccountItem
VacationAccountItem >── Account
```

---

## Quick Start (Local Dev)

### 1. Clone and install

```bash
git clone <your-repo>
cd hubspot-dashboard
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hubspot_dashboard"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set up database

```bash
# Create the database (if using local Postgres)
createdb hubspot_dashboard

# Push schema
npm run db:push

# Seed with sample data
npm run db:seed
```

### 4. Start dev server

```bash
npm run dev
```

Visit `http://localhost:3000`

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | sarah@agency.com | password123 |
| Team Lead | marcus@agency.com | password123 |
| Team Lead | priya@agency.com | password123 |
| Developer | james@agency.com | password123 |
| Developer | lena@agency.com | password123 |
| Designer | kobe@agency.com | password123 |

---

## Deploy to Vercel

### Option A: Vercel Postgres (Recommended)

1. **Push your repo to GitHub**

2. **Import to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Framework: Next.js (auto-detected)

3. **Add Vercel Postgres**
   - In your Vercel project → Storage → Connect Database → Postgres
   - This auto-sets `DATABASE_URL` and `POSTGRES_PRISMA_URL`

4. **Set environment variables** in Vercel dashboard:
   ```
   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

5. **Override build command** in Vercel settings:
   ```
   prisma generate && prisma db push && next build
   ```
   Or add to `package.json` scripts:
   ```json
   "vercel-build": "prisma generate && prisma db push && next build"
   ```

6. **Deploy** — Vercel will run the build automatically

7. **Seed production data** (optional):
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Link to your project
   vercel link

   # Pull env vars locally
   vercel env pull .env.local

   # Run seed against production DB
   npm run db:seed
   ```

### Option B: Neon (Serverless Postgres)

1. Create a database at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Add to Vercel env vars:
   ```
   DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
   ```

### Option C: Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database → Connection string (URI mode)
3. Add `?pgbouncer=true&connection_limit=1` to the URL for serverless environments

---

## Prisma Schema Management

```bash
# After changing schema.prisma:
npm run db:migrate        # Development (creates migration file)
# OR
npm run db:push           # Quick push (no migration history)

# View data
npm run db:studio         # Opens Prisma Studio at localhost:5555

# Reset and re-seed
npx prisma migrate reset  # ⚠️ Deletes all data
npm run db:seed
```

---

## Role Permissions Matrix

| Action | Admin | Team Lead | Developer | Designer |
|--------|-------|-----------|-----------|---------|
| View all accounts | ✅ | ❌ (own only) | ❌ (assigned only) | ❌ |
| Create account | ✅ | ✅ | ❌ | ❌ |
| Edit account | ✅ | ✅ (own) | ❌ | ❌ |
| View access details | ✅ | ❌ | ❌ | ❌ |
| Create handover | ✅ | ✅ | ❌ | ❌ |
| Edit handover | ✅ | ✅ (own) | ❌ | ❌ |
| Create vacation plan | ✅ | ✅ | ❌ | ❌ |
| View risk dashboard | ✅ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Export CSV | ✅ | ❌ | ❌ | ❌ |

---

## Security Notes

1. **Credentials masking**: `AccessDetail.credential` fields are masked in the UI via `maskCredential()`. In production, add field-level encryption using a library like `@prisma/extension-accelerate` or encrypt before storing.

2. **JWT sessions**: Using JWT strategy (stateless). Sessions expire per NextAuth defaults. Customize in `authOptions.session.maxAge`.

3. **Role enforcement**: Both middleware (edge) and API routes (server) check roles independently.

4. **SQL injection**: Prisma's parameterized queries prevent SQL injection by default.

5. **CSRF**: NextAuth handles CSRF tokens for its own routes. API routes use session tokens.

---

## Customization

### Adding a new field to Account

1. Add to `prisma/schema.prisma`
2. Run `npm run db:push`
3. Update `AccountForm.tsx`
4. Update the API route in `src/app/api/accounts/route.ts`
5. Display in `accounts/[id]/page.tsx`

### Adding an integration type

Edit the `IntegrationType` enum in `schema.prisma` and push.

### Changing the color theme

Edit CSS variables in `src/app/globals.css` under `:root`.

---

## Production Checklist

- [ ] `NEXTAUTH_SECRET` is a secure 32+ char random string
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`)  
- [ ] `NEXTAUTH_URL` matches your production domain exactly
- [ ] First admin user created (via seed or Prisma Studio)
- [ ] `prisma generate` runs in build command
- [ ] Access details encrypted at field level (not just masked)
- [ ] Rate limiting on `/api/auth` routes (use Vercel's WAF or middleware)
- [ ] Backup database scheduled (Vercel Postgres / Neon auto-backup)

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/accounts` | Any | List accounts (filtered by role) |
| POST | `/api/accounts` | Admin/Lead | Create account |
| GET | `/api/accounts/:id` | Role-filtered | Get account detail |
| PATCH | `/api/accounts/:id` | Admin/Lead | Update account |
| DELETE | `/api/accounts/:id` | Admin | Delete account |
| GET | `/api/handovers` | Any | List handovers |
| PATCH | `/api/handovers/:id` | Admin/Lead | Update handover |
| POST | `/api/handovers/activities` | Admin/Lead | Add activity |
| GET | `/api/vacation` | Self/Admin | List vacation plans |
| POST | `/api/vacation` | Admin/Lead | Create vacation plan |
| POST | `/api/tasks` | Admin/Lead | Create task |
| PATCH | `/api/tasks` | Admin/Lead/Assignee | Update task |
| GET | `/api/risks` | Admin | Risk aggregation |
| GET | `/api/dashboard` | Any | Dashboard stats |
| GET | `/api/export/accounts` | Admin | CSV export |
| GET | `/api/team` | Admin/Lead | List users |
| POST | `/api/team` | Admin | Create user |
