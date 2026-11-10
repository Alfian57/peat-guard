# Docker & Container Architecture

Direktori ini menampung seluruh konfigurasi kontainer (Docker) dan berkas deployment aplikasi PEATGUARD.

## Struktur Berkas

```
docker/
├── Dockerfile          # Multi-stage Docker image (development base + production runner)
├── entrypoint.sh       # Production entrypoint yang mensupervisi web server dan background worker
├── compose.dev.yaml    # Stack Docker Compose untuk lingkungan pengembangan lokal
└── README.md           # Dokumentasi arsitektur kontainer
```

## Lingkungan Pengembangan Lokal

Gunakan `compose.dev.yaml` untuk menjalankan stack pengembangan lokal (PostgreSQL + PostGIS, web server, dan background worker):

```bash
# Menjalankan seluruh stack
docker compose -f docker/compose.dev.yaml -p peatguard-main up --build

# Menghentikan kontainer
docker compose -f docker/compose.dev.yaml -p peatguard-main down
```

## Image Produksi

Image produksi dibangun secara otomatis melalui GitHub Actions CI/CD dan dipublikasikan ke GitHub Container Registry (`ghcr.io/alfian57/peat-guard:latest`).

Image menggunakan multi-stage build:

1. **`base`**: Node.js 22 Slim dengan Bun runtime terintegrasi dan dependensi sistem (OpenSSL).
2. **`deps`**: Instalasi frozen dependencies (`bun install --frozen-lockfile`).
3. **`builder`**: Prisma generate (`bun run db:generate`) dan kompilasi Next.js (`bun run build`).
4. **`runner`**: Minimal production runtime dengan `entrypoint.sh` yang menjalankan Next.js di foreground dan background worker NASA FIRMS di background supervisor loop.
