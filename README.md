# RituSaathi

**Track your cycle. Know what to ask.** A mobile-friendly menstrual health diary built with Next.js App Router, TypeScript, and responsive CSS. Shared English copy lives in `lib/strings.ts` and `lib/daily-strings.ts`.

## Run locally

Requires Node.js 20.9+ and npm.

```sh
npm ci
npm test
npm run lint
npm run build
npm start
```

Open http://127.0.0.1:3000. For development use `npm run dev`. No environment variables, login, or paid services are required. Next.js telemetry was disabled for verification (`NEXT_TELEMETRY_DISABLED=1`).

## Personal diary

- `/diary`: the Stitch Today dashboard, recent entries, a compact calendar, the last explicit period start, and elapsed calendar days.
- `/diary/history`: month calendar and chronological list, date details, completed cycle intervals, and date-verification flow.
- `/diary/summary`: last 90 days, last 6 calendar months, or all records; distinct **days logged with the inclusive date-range denominator**; optional diary-note inclusion; appointment questions; the document preview is the printable content.
- `/diary/settings`: local JSON backup/restore, privacy controls, and optional cycle-observation profile.

A check-in can include an explicit period start, flow, cramps, symptoms, optional sleep / study-work / usual-activity impact, and a short note. It opens as a desktop dialog or a mobile bottom sheet with a pinned save action. Impact choices distinguish unknown, affected, and explicitly not affected. Every field is optional, but at least one observation is needed. Unanswered values stay unknown; spotting/flow do not create period starts. Selecting an existing date loads its saved values and separate older notes. Deleting a day requires confirmation. Browser storage must succeed before a check-in is marked saved; a failed save leaves the draft open.

## Two-minute demo

1. On Home, choose **Explore a fictional example**. Point out the visible fictional label. Four starts are calculated as 141, 99, 51, and 7 calendar days before the date the example is first opened/reset. They produce **42, 48, 44 days**, together with one dated fictional symptom note. The example profile meets all four eligibility criteria.
2. Read the question above the timeline. Try **I’m unsure**, open **Visit summary**, and show the uncertainty. Return to the diary. **These dates are complete** acknowledges the three intervals and suggests a conversation with a healthcare professional. Dates can always be edited afterward.
3. Find **Presentation tip** in the sidebar (below the timeline on mobile). It displays the exact midpoint date of the longest completed interval from the currently recorded dates. Initially this is **75 calendar days before today**, midway between starts 99 and 51 days ago. For 16 November 2026, enter **2 September 2026**. Use the dynamically displayed date if presenting another day, or reset first to regenerate relative dates.
4. Choose **Add a missed period**, enter that midpoint, and save. Show **42, 24, 24, 44 days**. The three-long-cycle question disappears. The explanation is calculated from the actual enclosing interval and inserted date, and confirmation clears.
5. Open **Visit summary**, edit **What I want to ask**, and use **Print or save as PDF**. The print dialog uses the browser's PDF destination. Fictional labels remain in printed output; navigation and controls disappear.
6. Return Home and **Start my diary**: it begins empty. Add a personal entry, switch to the example and reset it, then return to confirm the personal entry is unchanged. Refresh `/diary` directly to demonstrate persistence.

## Privacy and storage

Personal and fictional records use distinct local-storage keys (`ritusaathi.personal.v1` and `ritusaathi.example.v1`). Opening/resetting the example never writes the personal key. The app does not send diary contents in URLs, network requests, logs, analytics, or AI calls. Newsreader and DM Sans are bundled locally through Fontsource packages (with Georgia/system-sans fallbacks); the build does not download fonts. All assets are local; clinical reference links are opened only when chosen. Browser print/PDF is controlled by the user.

Local storage is **not encrypted or access-controlled**. Anyone using the same device and browser profile may read it. Clearing browser/site data, using a temporary browser session, or changing browser profiles can remove or hide records. Multiple tabs are not synchronized; use one tab for editing. Storage errors show a visible warning, and malformed saved data is not silently overwritten. **Delete my diary** requires confirmation and removes the personal storage key, including dates, symptoms, context, and questions.

Backups contain private health information in plain text. The JSON file is generated and read locally; it is never uploaded to a service. Restore validates the envelope, dates, choices, and duplicate records, previews counts, and requires confirmation before replacing the personal diary. Invalid files leave existing records intact. Keep downloaded backups private.

The v2 data format adds `schemaVersion: 2` and an `entries` array while retaining the original period starts, separate dated notes, confirmation, profile, and questions. Existing production v1 records are upgraded in memory without writing on load; successful later saves persist v2 using the existing isolated storage keys. Unreadable data is locked rather than replaced, and Settings can download the original saved bytes for recovery. The Stitch update adds optional `impact` properties to v2 entries without changing storage keys or overwriting existing records. Absent impact fields remain unknown; explicit `false` means not affected. Back up before using older app versions, which do not understand daily entries or may discard impact fields on save.

## Observation scope — pending clinician review

The pure module `lib/diary.ts` enables one narrow observation only when all answers explicitly confirm: adult (18+), at least three years since first period, natural cycles, and outside pregnancy, postpartum, and perimenopause. Skipped/unsure/No answers disable the observation but leave the diary and summary usable. Symptoms are optional and are not inputs to the rule.

The latest **three completed consecutive intervals must each exceed 35 calendar days**. Exactly 35 does not qualify. The three-interval requirement is a **prototype demo design decision, not a clinical diagnostic criterion**. This app does not implement the full guideline or screening algorithm; it does not diagnose, estimate PCOS probability, infer hormones, predict fertility, or give an all-clear. Concerns can be discussed at any time. Missing dates can change the recorded pattern.

Clinical reference requested for the prototype: [Recommendations from the 2023 International Evidence-based Guideline](https://pmc.ncbi.nlm.nih.gov/articles/PMC10505534/). The PMC page required a browser challenge during development; the corresponding [2023 guideline publication on the publisher's website](https://academic.oup.com/jcem/article/108/10/2447/7242360) was consulted to verify the >35-day threshold for the relevant life stage. The implemented narrow rule still needs clinician review before use beyond a demonstration.

## Verification

`npm test` covers relative seed intervals, computed midpoint correction, exact 35-day boundaries, latest-three selection, all eligibility gates, sparse history, leap years, month/year/DST boundaries across time zones, date validation, storage validation, and confirmation invalidation. `npm run lint` and `npm run build` check the complete application. Period-date validation and duplicate rejection also run in the UI. Calendar intervals use ISO calendar dates converted to UTC ordinal days; “days since latest start” is separately labeled elapsed time.

Stitch implementation verification (17 November 2026): **31 tests passed**, **ESLint passed**, and the **standard Next.js production build passed**. The suite covers v1 migration, separate older notes, confirmation invalidation, flow/start independence, one record per date, edits/deletion, leap years and DST, range boundaries, completeness denominators, backup/import validation, storage failures, and private-note exclusion from the rendered print document. New tests cover impact-only entries, explicit false versus unknown, impact validation, lossless backup/reload, and accurate self-confirmation wording.

Safari checks on the running local app verified:

- Empty personal diary, logging a synthetic daily observation and yesterday’s explicit period start, refresh persistence, and editing cramps and the personal note.
- Calendar previous-month and return-to-today controls, selected-day details, and arrow-key navigation with focus following the selected date.
- Summary range changes, matching range/count denominators, and excluding note text from the preview. The print action opened a two-page A4 print preview with navigation and controls hidden, with intact observation blocks.
- The fictional midpoint interaction split the saved 48-day interval into 24 and 24 days, cleared date confirmation, and withdrew the old observation. Returning to the personal diary showed its original synthetic records intact.
- Desktop screenshots of Today, History, Summary, and the check-in dialog; Safari Responsive Design Mode at **390 × 812** for Today, History, Summary, the mobile bottom sheet, and the fictional correction. The layouts were compared with `design-reference/stitch/`; no horizontal overflow was observed. Mobile review prompted fixes to the Settings accessible name and the range selector’s touch height.

The export’s petrol, porcelain, citron, orchid, typography, spacing, cards, and selectors are implemented through shared `app/tokens.css`, `app/stitch.css`, and reusable calendar/icon components. Exported HTML and screenshots remain reference assets, not executable application code. Unsupported export content (phase/fertility predictions, heart-rate trends, fabricated clinical statistics, encrypted-vault claims, sync timestamps, and inert language/account controls) is omitted. Statistics and interval bars derive from saved records; unlogged days remain unknown.

Browser deletion, backup download/restore, corrupt-file recovery, quota exhaustion, reduced-motion OS settings, screen-reader operation, physical devices, and final PDF-file saving were not re-exercised in this pass; relevant persistence/import/deletion paths have automated tests. No installable PWA or offline guarantee is provided, and conflicting multi-tab edits remain a documented limitation. No deployment was performed.

## Deploy to Vercel

Repository: **pritish042/RITUSAATHI**, with `origin` set to [https://github.com/pritish042/RITUSAATHI](https://github.com/pritish042/RITUSAATHI). This checkout is `/Users/pritishdash/RITUSAATHI`; `package.json` and its matching `package-lock.json` are at the repository root. Import **RITUSAATHI** in Vercel and select the **main** branch.

Use these import settings:

| Setting | Value |
| --- | --- |
| Root Directory | `.` (the repository root; leave the root selection at its default) |
| Framework Preset | **Next.js** |
| Install Command | `npm ci` |
| Build Command | `npm run build` (standard `next build`) |
| Output Directory | Leave the Next.js default; no override |
| Environment Variables | **None** |

No API keys, database, external services, `vercel.json`, or custom deployment configuration are required. `next.config.ts` only anchors Turbopack to this repository to avoid unrelated parent-directory lockfiles during local builds. Bundled fonts work without build-time font downloads. Vercel performs the standard Next.js deployment; see [Vercel's Next.js documentation](https://vercel.com/docs/frameworks/full-stack/nextjs) and [build settings](https://vercel.com/docs/builds/configure-a-build).

The prototype has been built and launched **locally only**. Deployment is left to you. Browser diary data belongs to its origin: records at `127.0.0.1` will not automatically move to your Vercel domain, and preview domains each have separate local storage. The same shared-browser privacy limitations apply after deployment.
