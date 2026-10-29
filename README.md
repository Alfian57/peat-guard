# PEATGUARD

PEATGUARD is a WebGIS and offline-first field reporting application for peatland fire prevention and carbon impact tracking.

## Local development

Use Bun 1.3.1 and Docker Compose. Compose starts a development web service and an isolated PostgreSQL 17 database with PostGIS 3.7. It does not use an existing host database container or volume.

```sh
cp .env.example .env
docker compose -p peatguard-main up --build
```

The web service generates Prisma Client, applies checked-in migrations, seeds clearly marked illustrative data, and starts Next.js. Open the configured `WEB_PORT` (default `3000`). The local Postgres credentials in `.env.example` (`postgres` / `postgres`) are development defaults only; do not reuse them in a deployed environment.

Each checkout has its own Compose project and named volumes. Compose derives a project name from the directory by default; use an explicit unique `-p` name when running multiple clones. Ports must also be unique per clone. For example:

| Checkout           | Compose project     | `DB_PORT` | `WEB_PORT` |
| ------------------ | ------------------- | --------: | ---------: |
| Main checkout      | `peatguard-main`    |      5432 |       3000 |
| Field work clone   | `peatguard-field`   |      5541 |       3001 |
| Command work clone | `peatguard-command` |      5542 |       3002 |

Set both port variables in that clone's `.env`. If you run Prisma commands directly on the host, update `DATABASE_URL` to match `DB_PORT`. Inside Compose, the web and worker services use the private service hostname `postgres` and port `5432`; they do not use the host URL.

Use the same `-p` project name for every Compose command against a checkout. The commands below use `peatguard-main`; use `peatguard-field` or `peatguard-command` for the matching clone. For example:

```sh
docker compose -p peatguard-field up --build
docker compose -p peatguard-command up --build
```

Provider keys are optional for database setup. Set `DEEPSEEK_API_KEY`, `NASA_FIRMS_MAP_KEY`, and `NEXT_PUBLIC_MAPTILER_KEY` in the ignored `.env` when needed. The MapTiler key is public by design; DeepSeek and NASA credentials must remain server-side. Uploads persist in the Compose-scoped `uploads` volume at `/app/.data/uploads`.

The background worker is available with the `worker` profile. It currently starts an idle runner; the FIRMS feature adds scheduled work to it.

```sh
docker compose -p peatguard-main --profile worker up --build
```

`docker compose -p peatguard-main down` stops the main Compose project and keeps its data. `docker compose -p peatguard-main down --volumes` permanently deletes that project's database, Node modules, Next cache, and uploaded files. Use the project name for the checkout you intend to stop or reset; use `--volumes` only when you intentionally want to delete that local project's data.

## Database commands

When Compose is running, run project commands in the web container:

```sh
docker compose -p peatguard-main exec web bun run db:validate
docker compose -p peatguard-main exec web bun run db:generate
docker compose -p peatguard-main exec web bun run db:seed
```

For a local schema change, use Prisma Migrate against the development database:

```sh
docker compose -p peatguard-main exec web bunx prisma migrate dev --name describe_change
```

Do not reset or delete a shared database to create migrations. The PostGIS extension, spatial indexes, and database triggers are part of the checked-in migration history. See [database contracts and operations](docs/engineering/database.md) before changing spatial fields, report idempotency, or audit events.

## Project tools

- `bun run lint` runs ESLint.
- `bun run format` formats application files and project configuration.
- `bun run format:check` checks formatting without changing files.
- Husky runs `lint-staged` before commits, applying ESLint and Prettier to staged files.
- `bun run db:validate` validates the Prisma schema.
- `bun run db:generate` generates Prisma Client under `app/generated/prisma`.
- `bun run db:migrate:dev` creates and applies a development migration.
- `bun run db:migrate:deploy` applies checked-in migrations without resetting data.
- `bun run db:seed` inserts illustrative local demo data idempotently.
- `bun run worker` starts the background worker runner.

## Environment variables

`.env.example` contains safe local defaults and empty integration key placeholders. `.env` and local upload data are ignored by Git. Never commit API keys, database passwords, or uploaded field evidence.
