# Job Queue Dashboard — Frontend

React + Vite frontend for the Mini Job Queue Dashboard.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
```

Create a `.env` file if your backend isn't on `http://localhost:3000`:

```
VITE_API_URL=https://your-backend-url.com
```

## Project structure

```
src/
  api/jobs.js              one file, all backend calls
  constants.js              statuses + allowed transitions (mirrors backend rule)
  components/
    JobForm.jsx             create a job
    StatusSummary.jsx        counts per status (derived, not fetched)
    StatusFilterTabs.jsx     all / pending / running / completed / failed
    JobTable.jsx             renders the filtered list
    JobRow.jsx                one job: status buttons + delete
  App.jsx                    owns all state, wires everything together
```

## Data flow

`App.jsx` is the only component holding the real `jobs` array in state.
Everything else is a "dumb" component: it receives `jobs` (or a filtered
slice of it) and a handful of callback props, and calls those callbacks
when the user does something. This is standard "lift state up" React —
used here because the summary counts, the table, and the filter all need
to react to the same underlying list.

```
user action  →  component calls prop function  →  App.jsx calls api/jobs.js
                                                          │
                                                    backend responds
                                                          │
                                              App.jsx calls loadJobs() again
                                                          │
                                                 fresh jobs[] → re-render
```

Concretely:

- **Create** — `JobForm` collects title/type → calls `onCreate` → `App.handleCreate`
  → `POST /jobs` → re-fetch full list.
- **Change status** — `JobRow` shows only the *legal* next statuses (via
  `constants.js`) → calls `onStatusChange` → `App.handleStatusChange` →
  `PATCH /jobs/:id/status` → re-fetch.
- **Delete** — `JobRow` → `onDelete` → `App.handleDelete` → `DELETE /jobs/:id` →
  re-fetch.
- **Filter** — pure client-side state in `App.jsx` (`filter`), no API call.
  `filteredJobs` is derived with `useMemo`, never stored separately, so it
  can't drift out of sync with `jobs`.

After every write, the app **re-fetches the whole list** instead of
hand-patching the local array. For a dashboard this size that's a
deliberate simplicity trade-off, and it directly matters for the next
section.

## Reasoning about the two-tabs / concurrency scenario

The assignment asks: two tabs both see a job as `pending` and both try to
set it to `running` at nearly the same time. Where's the rule enforced,
what if someone bypasses the UI, what happens on a near-simultaneous
race, and how do you prevent an inconsistent state?

**The rule can never live only in the frontend.** `constants.js` mirrors
the transition rules so the UI can grey out invalid buttons and give
instant feedback — but that's a UX nicety, not enforcement. Anyone can
call the API directly with curl/Postman and skip the React app entirely,
so the backend must re-validate every transition against the job's
*current* row in the database on every request, and reject anything
illegal (e.g. `completed → running`) regardless of what the client
believes the current status is.

**The race condition** is the harder part: both tabs read `pending`,
both send `PATCH .../status { running }` within milliseconds. If the
backend does a plain "read row, check status in application code, then
write," both requests can pass the check before either write lands —
classic check-then-act race, and now the job has been "started twice."
The fix has to make the check and the write atomic at the database
level, not in application code, e.g. either:

- `UPDATE jobs SET status = 'running' WHERE id = $1 AND status = 'pending'`
  and inspect the affected-row count — if it's 0, someone else already
  moved it, so return a 409 Conflict; or
- wrap the read+write in a transaction with row-level locking
  (`SELECT ... FOR UPDATE`) if the transition logic is more complex than
  a single conditional update.

Either way, exactly one of the two requests wins, the other gets a clear
"this job is no longer pending" error instead of silently succeeding.

**On the frontend**, this shows up as: `JobRow.handleTransition` sends
the request; if the backend returns a conflict (because the other tab
won the race), the error is shown inline on that row rather than assumed
to have succeeded, and the next `loadJobs()` refresh corrects the row to
whatever the database actually has. The UI never assumes optimistic
success for a status change — it always trusts the server's response.

## Assumptions & trade-offs

- Re-fetching the full job list after every mutation is simple and always
  correct, but doesn't scale to a huge job list or feel truly "live" —
  a production version would use optimistic UI updates plus either
  polling or a WebSocket/SSE push from the backend when a job's status
  changes, so a second open tab updates without a manual refresh.
- No auth/user concept — every job is global. A real system would scope
  jobs per user/team.
- No pagination — fine for a demo-sized job list, not for thousands of
  jobs.

## Bonus / production-readiness idea

Add a `version` (or `updatedAt`) column used for **optimistic
concurrency control** on top of the conditional `UPDATE`: the client
sends back the version it last saw, and the update also checks
`AND version = $2`, incrementing it on success. This generalizes the
"pending → running" race fix to *every* field on the job, not just
status, which matters once the job model grows beyond four columns.
