FROM oven/bun:1.3.1 AS bun-runtime

FROM node:22-bookworm-slim

COPY --from=bun-runtime /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["node", "./node_modules/next/dist/bin/next", "dev", "--hostname", "0.0.0.0"]
