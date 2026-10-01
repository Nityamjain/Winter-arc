# Winter Arc

A private, offline-first habit tracker. Plain HTML, CSS and JavaScript. No backend, account, analytics, CDN or web fonts.

## Run locally
Service workers and installation need HTTPS or `localhost`; opening `index.html` via `file://` works as a normal page but will not install or cache.

    cd winter-arc
    python3 -m http.server 8080      # then open http://localhost:8080

## Install on Android
1. Host the folder on any HTTPS static host (GitHub Pages, Netlify, Cloudflare Pages) and open it once in Chrome while online.
2. Chrome menu, then **Add to Home screen** / **Install app**.
3. Launch **Winter Arc** from the home screen. It opens in standalone mode without browser UI.

## Offline
`service-worker.js` precaches every file on first load (cache name `winter-arc-v1`) and serves cache-first. To ship an update, change the `CACHE` version string; old caches are deleted on activation. Test: load once, enable airplane mode, refresh.

## Storage
All data lives in the browser's `localStorage` (key `winterArc.v1`) on this device: arc, habits, categories, completions, settings, notification settings and a reserved `streakShield` object. Streaks and scores are never stored; they are recalculated from completions using local calendar dates (no UTC conversion). The app requests persistent storage, but clearing site data in Chrome deletes everything, so use **Settings > Export data** for backups.

## Notifications: limits
- Permission is requested only when you switch on a reminder.
- A plain web page cannot schedule alarms. Reminders are checked every 30 seconds by JavaScript, so they fire only while the app is open or its process is still alive in the background.
- Android may freeze or kill background web apps (battery optimization, Doze, swiping the app away). Missed reminders are not delivered later, and a reminder fires only within 10 minutes of its set time.
- Guaranteed alarms require a native app or a push server; both are deliberately excluded here.
- The tracker never depends on notifications.

## Tests
    node tests/core.test.js        # dates, scores, streaks
    npm i jsdom && node tests/ui-smoke.js   # setup, toggle, persist, reset, import (run from a folder with jsdom)

## Rules worth knowing
- A day is successful at or above the success threshold. An unfinished **today** does not break a streak until the day ends.
- Habits count only from the day they were created, so adding a habit does not change past scores.
- Score bands are in `LEVELS` at the top of `core.js`.
