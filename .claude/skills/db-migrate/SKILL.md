---
allowed-tools: Bash(npx:*)
description: Migrate database using Prisma and regenerate the client
---

# DB Migrate

Run a Prisma migration and regenerate the client.

Look at the recent changes to `backend/prisma/schema.prisma` (via git diff or reading the file) to determine an appropriate migration name that describes the schema change, then run:

```
cd backend && npx prisma migrate dev --name <appropriate-migration-name> && npx prisma generate
```

Use a short, descriptive, snake_case migration name based on what changed (e.g. `add_user_avatar`, `create_chart_table`, `add_refresh_token_index`).
