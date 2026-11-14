# Demo report photo sources

These six synthetic WebP photos are permanent seed sources. Keep them in Git;
the fresh-reset script only clears files from the private runtime uploads
directory (`.data/uploads/`). The seeder selects two distinct images for each
report scenario and writes a UUID-named private copy after running the same
normalization used for uploaded report photos.
When demo reports already exist, `bun run db:seed` checks their referenced
files in the current `UPLOADS_DIR`. It restores a missing photo at the existing
private filename; if a report has no valid filename, it assigns a fresh one.
Run it in the web container when the app uses the Compose upload volume.

The images are illustrative demo material, not documentation of real fires,
patrols, or field conditions.

## Image prompts

- `smoke-peat-01.webp`: Square documentary-style photo of pale smoke over dark
  peat soil among Central Kalimantan ferns and shrubs, no visible flames.
- `smoke-peat-02.webp`: A distant thin smoke plume viewed from a wet patrol
  trail through tropical peatland vegetation, no visible flames.
- `canal-check-01.webp`: A shallow peat canal with a weathered wooden
  water-control barrier and exposed damp banks.
- `canal-check-02.webp`: A different diagonal view of a timber check-dam with
  shallow water passing around a loose board.
- `wetland-vegetation-01.webp`: Healthy wet peat-swamp forest with ferns,
  mossy roots, and a reflective shallow pool.
- `wetland-trail-02.webp`: A muddy patrol footpath through dense peat-swamp
  forest after rain, with puddles and wet leaf litter.

All prompts requested photorealistic square field-camera framing, natural
daylight, no people, no logos, no text, and synthetic demo imagery rather than
real incident evidence.
