---
allowed-tools: Read, Write, Edit, Bash(node:*), Bash(npx:*)
description: Write backend integration tests against a real test database
argument-hint: [route-or-feature] [test-file-name]
---

# Write Integration Tests

Write integration tests for: $ARGUMENTS

## Testing Strategy

- **Integration tests only** — no mocks for services or the database. Tests hit real Fastify routes and a real PostgreSQL test database configured via `.env.test`.
- The test database is wiped via `prisma migrate reset --force` in the `before()` hook.
- Seed required data directly through `(app as any).prisma` — do not rely on prior test state.
- Each `describe` block should be self-contained.

## Reference Example

@backend/test/auth.test.ts

## File Structure

New test files go in `backend/test/`. Name them `<feature>.test.ts`.

## Imports & Setup Boilerplate

```typescript
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { FastifyInstance } from 'fastify';
import buildApp from '../src/app.js';

describe('<feature> integration tests', () => {
  let app: FastifyInstance;

  before(async () => {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('Refusing to wipe database: NODE_ENV is not "test"');
    }
    app = await buildApp();
    await app.ready();
    const { execSync } = await import('node:child_process');
    execSync('npx prisma migrate reset --force');
  });

  after(async () => {
    await app.close();
  });

  // tests...
});
```

## Rules

- Use `assert.equal(response.status, <code>)` to check HTTP status.
- Use `(app as any).prisma.<model>.<method>()` to read/write DB directly in tests.
- When seeding data for a test, do it inside that specific `test()` callback (or a `beforeEach`) — not in `before()` unless it's shared across all tests in the block.
- Test both happy paths and error cases (invalid input, missing auth, conflicts, etc.).
- Keep `describe` blocks grouped by route (e.g. `describe('POST /charts', ...)`).

## Running Tests

To run all backend tests:
```bash
cd backend && npm run test
```

To run a single file:
```bash
cd backend && node --import tsx --test test/<file>.test.ts
```
