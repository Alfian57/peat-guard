# Volunteer application screenshots

These are actual application captures made with Playwright on localhost using
the seeded **Relawan Demo** account. They are not generated mock interfaces.
The desktop landing page displays them inside a decorative phone frame.

| Asset                    | Application view        | State                                                                                 |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------------------- |
| `field-app-capture.webp` | `/field/reports/create` | Kanal kering demo sample selected in the actual report form.                          |
| `field-app-saved.webp`   | `/field/queue`          | Built-in offline simulation active; one pending draft and one previously sent report. |
| `field-app-sent.webp`    | `/field/home`           | Offline simulation disabled; the home screen shows the previously synced demo report. |

Refreshed with the selected **Akar Kehidupan** brand at a **390 × 844 CSS pixel** viewport on 17–18 November 2026 and compressed
to lossless WebP without cropping, retouching, or replacing application text.
Only the Next.js development toolbar was hidden during capture. The camera,
speaker, metal edge, side buttons, and home indicator belong to the surrounding
CSS frame and do not cover application content.

The flow used the built-in canal demo sample, its supplied example coordinates,
and a note identifying it as a demonstration for the landing page. AI analysis
was left off. The new pending draft was removed through the application's local
draft action after capture; the already synced report was retained. No additional
server report was submitted to refresh the branding. The application retains its own **Sampel demo** labels; these
screenshots do not document an operational incident. No private account data,
customer reports, authentication tokens, or live session content are embedded
by the landing page.

To refresh the captures, use a local demo volunteer session, select the canal
sample in the form, activate the built-in offline simulation before saving,
capture the local queue, and reconnect to capture the synced home screen.
Wait for the visible session, sample preview, and queue states to finish loading.
Keep the native demo labels. Preserve the viewport aspect ratio and use lossless
compression for UI text.
