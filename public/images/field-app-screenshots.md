# Volunteer application screenshots

These are genuine screens from the local PEATGUARD application, captured with
Playwright using the seeded **Relawan Demo** account. They are not composed or
retouched mock interfaces. Each capture is **390 × 844 CSS pixels** and stored
as lossless WebP. The Next.js development toolbar was hidden.

| Asset                    | Application view        | Captured state                                                                                              |
| ------------------------ | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| `field-app-capture.webp` | `/field/reports/create` | Offline indicator, synthetic canal photo selected, and the `Kanal` category.                                |
| `field-app-saved.webp`   | `/field/queue`          | One local draft waiting to sync while offline; the current UI reports `0 terkirim` and unavailable history. |
| `field-app-sent.webp`    | `/field/home`           | Connected home screen, scrolled to reports carrying the application's native `Sampel demo` label.           |

The form capture uses `public/samples/kanal-kering.webp`, a synthetic demo
image, with a note identifying it as a landing-page illustration. The current
form treats uploaded photos as regular evidence and does not add a native demo
badge to this view. The section's exterior caption identifies the visuals as
illustrative.

The offline draft was created in the browser's local report store and deleted
through the app after capture. Connectivity was restored only after deletion,
so no report was submitted to the server. Existing seeded reports were left
unchanged. No authentication tokens or private account data are embedded.

To refresh the captures, run the local app, sign in with the demo volunteer,
upload the synthetic canal image, set the sample coordinates and category, and
enable offline simulation before saving. Capture the queue before deleting the
draft. Reconnect and capture the home screen at the first rows labeled
`Sampel demo`. Preserve the 390 × 844 viewport and lossless compression so UI
text remains clear.
