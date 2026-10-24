# Architecture

```
Browser (Next.js, Apollo Client)  --Bearer JWT-->  NestJS GraphQL API  -->  Prisma  -->  SQLite
  UI hides what you cannot do                       AuthGuard (RBAC)
                                                    OrdersService.scope / countryFilter (Re-BAC)
```

## Request path
1. `login` (the only public operation) checks bcrypt hash, returns a JWT containing only the user id.
2. Every other operation passes the global `AuthGuard`: verify token, load user from DB, compare role against `@Allow(action)`.
3. Services apply the country scope in the `where` clause, so out-of-scope rows are never fetched.

## Data model
```
User(role, country) 1--* Order(status, country, total) *--1 Restaurant(country) 1--* MenuItem
Order 1--* OrderItem(quantity, unitPrice snapshot) *--1 MenuItem
Order *--0..1 PaymentMethod(type, label, last4, isDefault)
```
`unitPrice` is copied onto the order line so later menu price changes do not rewrite history. Only the last four digits of a card are stored.

## Decisions
- **Why a draft order is the cart:** the brief separates "create order" (everyone) from "checkout" (Manager and up). A Member's draft is a real order that a Manager in the same country can pay for.
- **Why 404 instead of 403 for cross-country access:** avoids leaking that an id exists.
- **Why the user is reloaded on each request:** role or country changes take effect immediately instead of at token expiry.
- **Admin country:** Nick has a country in the seed data for display, but the scope helper ignores it for admins.
