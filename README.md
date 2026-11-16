# RituSaathi

**Track your cycle. Know what to ask.** A mobile-friendly menstrual health diary prototype built with Next.js App Router, TypeScript, and responsive CSS. English presentation copy is centralized in `lib/strings.ts` for future Odia translation.

## Run locally

Requires Node.js 20.9+ and npm.

```sh
npm install
npm test
npm run lint
npm run build
npm start
```

Open http://127.0.0.1:3000. For development use `npm run dev`. No environment variables, login, or paid services are required. Next.js telemetry was disabled for verification (`NEXT_TELEMETRY_DISABLED=1`).

## Two-minute demo

1. On Home, choose **Explore a fictional example**. Point out the visible fictional label. Four starts are calculated as 141, 99, 51, and 7 calendar days before the date the example is first opened/reset. They produce **42, 48, 44 days**, together with one dated fictional symptom note. The example profile meets all four eligibility criteria.
2. Read the question above the timeline. Try **I’m unsure**, open **Visit summary**, and show the uncertainty. Return to the diary. **These dates are complete** acknowledges the three intervals and suggests a conversation with a healthcare professional. Dates can always be edited afterward.
3. Find **Presentation tip** in the sidebar (below the timeline on mobile). It displays the exact midpoint date of the longest completed interval from the currently recorded dates. Initially this is **75 calendar days before today**, midway between starts 99 and 51 days ago. For 16 November 2026, enter **2 September 2026**. Use the dynamically displayed date if presenting another day, or reset first to regenerate relative dates.
4. Choose **Add a missed period**, enter that midpoint, and save. Show **42, 24, 24, 44 days**. The three-long-cycle question disappears. The explanation is calculated from the actual enclosing interval and inserted date, and confirmation clears.
5. Open **Visit summary**, edit **What I want to ask**, and use **Print or save as PDF**. The print dialog uses the browser's PDF destination. Fictional labels remain in printed output; navigation and controls disappear.
6. Return Home and **Start my diary**: it begins empty. Add a personal entry, switch to the example and reset it, then return to confirm the personal entry is unchanged. Reload and open the diary again to demonstrate persistence.

## Privacy and storage

Personal and fictional records use distinct local-storage keys (`ritusaathi.personal.v1` and `ritusaathi.example.v1`). Opening/resetting the example never writes the personal key. The app does not send diary contents in URLs, network requests, logs, analytics, or AI calls. Assets and fonts are local; clinical reference links are opened only when chosen. Browser print/PDF is controlled by the user.

Local storage is **not encrypted or access-controlled**. Anyone using the same device and browser profile may read it. Clearing browser/site data, using a temporary browser session, or changing browser profiles can remove or hide records. Multiple tabs are not synchronized; use one tab for editing. Storage errors show a visible warning, and malformed saved data is not silently overwritten. **Delete my diary** requires confirmation and removes the personal storage key, including dates, symptoms, context, and questions.

## Observation scope — pending clinician review

The pure module `lib/diary.ts` enables one narrow observation only when all answers explicitly confirm: adult (18+), at least three years since first period, natural cycles, and outside pregnancy, postpartum, and perimenopause. Skipped/unsure/No answers disable the observation but leave the diary and summary usable. Symptoms are optional and are not inputs to the rule.

The latest **three completed consecutive intervals must each exceed 35 calendar days**. Exactly 35 does not qualify. The three-interval requirement is a **prototype demo design decision, not a clinical diagnostic criterion**. This app does not implement the full guideline or screening algorithm; it does not diagnose, estimate PCOS probability, infer hormones, predict fertility, or give an all-clear. Concerns can be discussed at any time. Missing dates can change the recorded pattern.

Clinical reference requested for the prototype: [Recommendations from the 2023 International Evidence-based Guideline](https://pmc.ncbi.nlm.nih.gov/articles/PMC10505534/). The PMC page required a browser challenge during development; the corresponding [2023 guideline publication on the publisher's website](https://academic.oup.com/jcem/article/108/10/2447/7242360) was consulted to verify the >35-day threshold for the relevant life stage. The implemented narrow rule still needs clinician review before use beyond a demonstration.

## Verification

`npm test` covers relative seed intervals, computed midpoint correction, exact 35-day boundaries, latest-three selection, all eligibility gates, sparse history, leap years, month/year/DST boundaries across time zones, date validation, storage validation, and confirmation invalidation. `npm run lint` and `npm run build` check the complete application. Period-date validation and duplicate rejection also run in the UI. Calendar intervals use ISO calendar dates converted to UTC ordinal days; “days since latest start” is separately labeled elapsed time.

Verified in this workspace: **13 tests pass**, **ESLint passes**, and **production build passes**. The production server was launched at **http://127.0.0.1:3000**, and an HTTP smoke check verified the home page. Runtime dependency audit reported zero known advisories at handoff. Mobile browser interaction, rendered layout, browser reload persistence, and the print dialog could not be manually exercised because the browser-control host was unavailable. Persistence and example-reset isolation were verified with the same storage module the UI uses, against an in-memory storage implementation; this is not a substitute for browser QA.

GitHub publishing was skipped because `gh auth status` reported an invalid authentication token. The completed repository is committed locally on `main`.
