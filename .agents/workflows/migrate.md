---
description: Run database migrations and generate the Prisma client
---

Follow these steps to run a database migration after changes have been made to `schema.prisma`:

1. Determine an appropriate name for the changes made to `schema.prisma`. Format this name in kebab-case (where each word is lowercased and separated by a dash, e.g., `add-user-table`).
2. Run the migration command in the `backend` directory:

```bash
cd backend && npx prisma migrate dev --name <your-kebab-case-name>
```

// turbo 3. Run the following command in the `backend` directory to generate the Prisma client:

```bash
cd backend && npx prisma generate
```
