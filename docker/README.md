# Docker & Container Architecture

Direktori ini menampung seluruh konfigurasi kontainer (Docker) dan berkas deployment aplikasi PEATGUARD.

## Struktur Berkas

```
docker/
├── Dockerfile          # Image development aplikasi Next.js & Bun runtime
├── compose.dev.yaml    # Stack Docker Compose untuk lingkungan pengembangan lokal
└── README.md           # Dokumentasi arsitektur kontainer
```

## Lingkungan Pengembangan Lokal

Gunakan `compose.dev.yaml` untuk menjalankan stack pengembangan lokal (PostgreSQL 17 + PostGIS 3.7, web server, dan background worker):

```bash
# Menjalankan seluruh stack
docker compose -f docker/compose.dev.yaml -p peatguard-main up --build

# Atau menggunakan symlink di root proyek
docker compose -f compose.dev.yaml -p peatguard-main up --build

# Menghentikan kontainer
docker compose -f docker/compose.dev.yaml -p peatguard-main down
```

## Konvensi Deployment Masa Depan

Seluruh berkas yang berkaitan dengan deployment (staging, produksi, CI/CD, maupun orkestrasi kontainer) WAJIB diletakkan di dalam folder `docker/`:

- `Dockerfile.prod`: Multi-stage production build image (jika ditambahkan).
- `compose.prod.yaml`: Konfigurasi Compose untuk lingkungan produksi.
- Berkas manifes / konfigurasi infrastruktur lainnya.
