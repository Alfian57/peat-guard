This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Development setup

Use Bun 1.3.1, install dependencies, and configure a PostgreSQL URL:

```sh
bun install
cp .env.example .env
```

Set `DATABASE_URL` in `.env`, then generate Prisma Client and start Next.js:

```sh
bun run db:generate
bun run dev
```

The `.env` file is ignored by Git. Do not commit database credentials. Prisma is initialized without domain models or migrations; add models to `prisma/schema.prisma` before creating migrations.

## Project tools

- `bun run lint` runs ESLint.
- `bun run format` formats application files and project configuration.
- `bun run format:check` checks formatting without changing files.
- Husky runs `lint-staged` before commits, applying ESLint and Prettier to staged files.
- `bun run db:validate` validates the Prisma schema.
- `bun run db:generate` generates Prisma Client under `app/generated/prisma`.
- `bun run build` generates Prisma Client before building Next.js; `DATABASE_URL` must be set in `.env` or the deployment environment.

shadcn/ui configuration lives in `components.json`; add components with `bunx shadcn add <component>`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
