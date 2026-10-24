# Urban Eats: role- and country-aware food ordering

Full-stack app: **NestJS + GraphQL + Prisma** API, **Next.js + TypeScript + Tailwind + Apollo Client** web app.
Implements the RBAC matrix from the assignment plus the **Re-BAC** (Managers and Members are confined to their own country).

## Run locally

Requires Node 18+. The database is SQLite, so there is nothing else to install.

```bash
# 1. API  (http://localhost:4000/graphql)
cd backend
cp .env.example .env
npm install
npm run setup        # prisma generate + create DB + seed demo data
npm run start:dev

# 2. Web  (http://localhost:3000), in a second terminal
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Demo accounts (password for all: `password123`):

| User | Email | Role | Country |
|---|---|---|---|
| Nick Fury | nick.fury@slooze.xyz | Admin | org-wide |
| Captain Marvel | captain.marvel@slooze.xyz | Manager | India |
| Captain America | captain.america@slooze.xyz | Manager | America |
| Thanos | thanos@slooze.xyz | Member | India |
| Thor | thor@slooze.xyz | Member | India |
| Travis | travis@slooze.xyz | Member | America |

## Access rules

| Function | Admin | Manager | Member |
|---|---|---|---|
| View restaurants and menus | yes | yes | yes |
| Create order (add items) | yes | yes | yes |
| Checkout and pay | yes | yes | no |
| Cancel order | yes | yes | no |
| Add / modify payment methods | yes | no | no |

**Re-BAC:** Admin sees everything. A Manager sees every restaurant and order in their country. A Member sees their country's restaurants and only their own orders. Anything outside that scope returns "not found" rather than "forbidden", so ids from the other country are not even confirmed to exist.

## Try the access model

1. Sign in as **Thanos** (Member, India). Only Indian restaurants appear. Add a few dishes. There is no checkout, only a note that a manager must pay.
2. Sign out, sign in as **Captain Marvel** (Manager, India). Orders shows Thanos's draft. Pay and place it with the company card. Payment methods are visible but read only.
3. Sign in as **Captain America** (Manager, America). Thanos's order is not visible, and neither are Indian restaurants.
4. Sign in as **Nick Fury**. Both countries are visible, and Payment methods can be added, renamed or set as default.
5. Try the API directly: a Member calling `placeOrder` gets `Role MEMBER is not allowed to perform this action`.

## How it is built

- `backend/src/auth/permissions.ts`: the RBAC matrix as data. Resolvers declare `@Allow('placeOrder')`; the global `AuthGuard` verifies the JWT, loads the user fresh from the DB and checks the role.
- `backend/src/common/scope.ts` and `OrdersService.scope()`: the Re-BAC rules. Every read and write that touches country-owned data goes through them, so the check cannot be skipped by a single resolver forgetting it.
- The frontend mirrors the matrix in `frontend/src/lib/policy.ts` only to hide buttons. The API is the source of truth.
- Orders have a `DRAFT` stage (the cart), then `PLACED` or `CANCELLED`. Each order stores its restaurant's `country`, which is the scoping key. One open cart per user, one restaurant per cart.
- Payment is simulated: placing an order records the chosen method and flips the status. No money moves.
## Known limits

- SQLite and string columns instead of enums, to keep setup to one command. For production, switch the Prisma provider to PostgreSQL and make `role`, `country` and `status` native enums.
- JWT lives in `localStorage` for simplicity; an httpOnly cookie would be better for production.
- Payment methods are company-wide (not per country), since the brief gives only the Admin the right to change them.
- No automated tests yet.
