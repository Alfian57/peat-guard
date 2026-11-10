# Demo profile avatars

These three generated portraits are fictional demo assets used by the local
database seed. Keep the source images in this tracked folder. `bun run db:seed`
normalizes each image with the same square WebP processor used for profile
uploads, copies it into the ignored private upload directory, and stores only
the authenticated avatar route in the seeded user's `image` field.

To replace an image, generate a professional, realistic portrait of a fictional
Indonesian adult with no logos, identifying marks, or real-person reference.
Save a square JPEG or WebP under one of these names:

- `relawan-demo.webp`
- `posko-demo.webp`
- `verifikator-demo.webp`

Run `bun run db:seed` to refresh the demo accounts. Uploaded runtime avatars
belong in `.data/uploads/` and must not be committed.
