# PEATGUARD · Akar Kehidupan

Identitas terpilih: referensi **04 · Akar Kehidupan**, dengan kanopi, akar, dan lapisan tanah gambut. Sumber pilihan disimpan di [root proyek](../../peatguard-logo-ref-04-akar-kehidupan.png).

## Asset dan pemakaian

| Berkas                                                                     | Pemakaian                                                                      |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [logo-horizontal.png](logo-horizontal.png)                                 | Navbar, sidebar, header relawan/posko/audit, login, footer, dan dokumen audit. |
| [logo-symbol.png](logo-symbol.png)                                         | Simbol tanpa tulisan untuk ruang sempit atau materi pendukung.                 |
| [logo-circle.png](logo-circle.png)                                         | Emblem dengan border lingkaran untuk header peta dan halaman offline.          |
| [logo-stacked.png](logo-stacked.png)                                       | Susunan vertikal dari referensi terpilih untuk materi identitas.               |
| [app-icon-192.png](app-icon-192.png), [app-icon-512.png](app-icon-512.png) | Ikon instalasi PWA.                                                            |
| [app-icon-maskable-512.png](app-icon-maskable-512.png)                     | Ikon dengan ruang aman untuk pemotongan launcher Android.                      |

Komponen bersama: `components/brand/brand-logo.tsx`. Gunakan `tone="dark"` di atas foto atau permukaan gelap: filter CSS membalik siluet asset bersih menjadi putih sehingga bentuknya tetap sama. Emblem lingkaran mempertahankan latar kremnya. Ukuran dan rasio asli dinyatakan untuk mencegah pergeseran layout. Asset publik dimuat langsung agar dapat dicache service worker saat offline.

Ukuran tampilan dibuat ringkas: navbar desktop dan sidebar 40 px, header peran mobile 32 px, navbar mobile sekitar 30 px (lebar 96 px), footer 48 px, login 52 px, dokumen audit 36 px, emblem peta 32 px, dan emblem offline 52 px. Rasio gambar tetap asli dan tautan logo mempertahankan tinggi area klik minimal 44 px.

Header sidebar hanya menampilkan logo tanpa label peran. Warna dan susunannya mengikuti [panduan sidebar](../../docs/design-system.md#role-sidebars).

Ikon browser ada di `app/favicon.ico` (16/32/48 px), `app/icon.png` (128 px), dan `app/apple-icon.png` (180 px). Next.js menambahkan metadata ikon dari konvensi berkas tersebut. Warna UI tetap memakai token forest/paper/sun yang sudah ada.

## Pembuatan

Varian dibuat dengan **built-in image_gen**, menggunakan referensi 04 sebagai target edit. PNG mempertahankan transparansi; trimming margin transparan, resize, kompresi, dan pengemasan favicon dilakukan secara mekanis. Tidak ada dependency baru. Tampilan putih memakai filter CSS pada asset horizontal sehingga siluetnya selalu konsisten.

### Prompt referensi terpilih

```text
Use case: logo-brand. Create ONE original professional logo proposal for PEATGUARD, an Indonesian peatland protection, wildfire early-warning, offline field reporting and carbon accountability application. This is an independent new identity exploration. Style: extremely clean, restrained, memorable flat graphic with vector-like precision, coherent bold shapes, intentional negative space, legible as a small app icon. Composition: square canvas, generous transparent margins, a compact centered symbol above one centered wordmark. The symbol should be visually dominant but economical, and the exact uppercase wordmark "PEATGUARD" should be clearly readable below in a refined, strong, slightly condensed sans serif. Spell P E A T G U A R D exactly, with considered spacing. Transparent background throughout, including symbol cutouts. No mockup, paper, device, photograph, 3D, gradients, texture, shadow, glow, slogan, labels, reference numbers or extra text. The only text is PEATGUARD. DESIGN DIRECTION: Living roots and stored carbon. Create an abstract, sculptural tropical tree-root glyph with one broad rounded canopy, a short central trunk, and three broad branching roots that interlock with ONE horizontal peat layer in negative space. Reduce the tree and ground to a striking cohesive symbol with at most four bold shapes. The roots, not leaves, are the memorable element. Use forest green #1F4D3D canopy, deep peat brown #594536 lower root/ground shape, and forest-green wordmark. Mature ecological stewardship, almost like a beautifully designed natural seal but without a surrounding circle or badge. No literal detailed leaves, thin twigs, mountains, shield, hands, flame or generic seedling. Keep the geometry simple enough to reproduce in one ink.
```

### Prompt varian horizontal

```text
The attached image is the SELECTED and APPROVED PEATGUARD logo, not loose inspiration. Preserve its exact broad three-lobed tropical canopy, short trunk, THREE broad branching roots, curved peat-soil base, negative-space cuts, and the exact PEATGUARD wordmark letterforms when requested. Brand palette: forest green #1F4D3D, peat brown #594536. Clean flat logo artwork only: opaque uniform fills, sharp smooth antialiased edges, genuinely transparent empty background and cutouts. No texture, gradient, shadow, glow, halos, stray speckles, mockup, new motif or added text. Create a HORIZONTAL full-color lockup. Place the complete tree/root/peat emblem on the LEFT, and the exact uppercase PEATGUARD wordmark in forest green on the RIGHT on one line. Emblem height about 2 times the capital-letter height; vertically center the wordmark on the emblem. Use the original heavy clean sans-serif letterforms, do not substitute a condensed font. Refined gap between emblem and wordmark, no divider. Wide landscape canvas, finished logo footprint about 4.3:1, balanced tight transparent margins. No stacked layout, no tagline. Output only this one horizontal logo.
```

### Prompt varian symbol

```text
The attached image is the SELECTED and APPROVED PEATGUARD logo, not loose inspiration. Preserve its exact broad three-lobed tropical canopy, short trunk, THREE broad branching roots, curved peat-soil base, negative-space cuts, and the exact PEATGUARD wordmark letterforms when requested. Brand palette: forest green #1F4D3D, peat brown #594536. Clean flat logo artwork only: opaque uniform fills, sharp smooth antialiased edges, genuinely transparent empty background and cutouts. No texture, gradient, shadow, glow, halos, stray speckles, mockup, new motif or added text. Extract the SYMBOL ONLY as a compact square app mark. Remove the PEATGUARD lettering completely. Preserve the exact approved tree, three roots and peat ground shape; use the original forest-green tree and peat-brown soil, with transparent negative-space gaps. Center the complete emblem with about 8% clear transparent margin on all sides. Symbol occupies most of the square. No ring, badge, frame, lettering or new design. Output one crisp transparent square PNG emblem.
```

### Prompt varian circle

```text
The attached image is the SELECTED and APPROVED PEATGUARD logo, not loose inspiration. Preserve its exact broad three-lobed tropical canopy, short trunk, THREE broad branching roots, curved peat-soil base, negative-space cuts, and the exact PEATGUARD wordmark letterforms when requested. Brand palette: forest green #1F4D3D, peat brown #594536. Clean flat logo artwork only: opaque uniform fills, sharp smooth antialiased edges, genuinely transparent empty background and cutouts. No texture, gradient, shadow, glow, halos, stray speckles, mockup, new motif or added text. Create the CIRCULAR BADGE VARIANT. Use the exact selected tree-and-root symbol without any lettering, centered INSIDE one clean circular forest-green border. The circle interior is a solid warm paper cream #F6F7EF for excellent contrast on light and dark UI, the exterior of the circle is completely transparent. Preserve forest-green canopy/trunk/roots and peat-brown ground. The complete symbol occupies about 68% of the circle diameter and has clear room from the border. Circle diameter about 92% of the square canvas, border width about 2% of diameter. No text around the circle, no outer decorations, no double border, no shadow, no gradient, no new leaves or shapes. Output one clean square PNG badge.
```
