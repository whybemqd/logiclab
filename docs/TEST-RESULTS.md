Built by Olivia — https://discord.gg/ojailbreaks

# Actual verification record

Local checks performed by AI tooling on **5 November 2026**, Windows, Node **22.14.0**, npm **11.16.0**. These are not applicant-performed test claims.

| Command | Observed result |
|---|---|
| `npx vitest run tests/half-adder.test.ts` | 1 file passed, 5 tests passed (initial half-adder milestone) |
| `npm test` | 2 files passed, 74 tests passed |
| `npm run build` | TypeScript check and Vite 8.3.6 production build succeeded after correcting a JSX syntax error |
| `npx playwright install chromium` | Chromium and required local Playwright browser components installed successfully |
| `npm run test:e2e` | 18 passed, 2 intentionally skipped, no failures in the corrected run |
| Local `GET http://127.0.0.1:4173/logiclab/` | HTTP 200 |
| `npm run check` (final combined run) | 74 unit tests passed, production build succeeded, 18 browser tests passed, 2 intentional skips |

Browser checks run against the production build using Chromium desktop (1440 × 1100 viewport) and Chromium Pixel 7 emulation (390 × 844 viewport). Two skipped cases are desktop-only node movement/gate selection and wire editing; the same cases passed on desktop. Mobile loading, toggling, half/full-adder verification, broken detection, repair, JSON round-trip, malformed import, Expected editing, unknown-value handling, refresh, asset responses and horizontal overflow checks passed. This is not physical-device or cross-browser certification.

Engine checks cover every supported gate, all 4 half-adder and 8 full-adder combinations, exact broken-circuit mismatch, independent reference mutation, component/connection insertion order, fan-out, 64 combinations, invalid ports/directions/endpoints, multiple drivers, missing inputs, self/multi-gate loops, duplicate IDs, bad assignments, limits, invalid Expected data and versioned JSON round-trips/rejections.

| Example | Expected observed outcome |
|---|---|
| Half-adder | 4 passing, 0 failing |
| Full-adder | 8 passing, 0 failing |
| Broken half-adder | 3 passing, 1 failing; only A=1/B=1, Expected Sum=0, Actual Sum=1 |
| Repaired half-adder | 4 passing, 0 failing |

Actual screenshots are captured by the passing browser suite in `docs/screenshots/working-desktop.png`, `error-desktop.png`, `working-mobile.png` and `error-mobile.png`. The `working-circuit.png`, `working-verification.png`, `error-circuit.png` and `error-verification.png` files capture the corresponding real sections for portfolio layout. These captures were refreshed against the public deployment after it succeeded. The final local combined run's raw output is retained in `docs/local-check.log` and the public browser run in `docs/public-check.log`.

The first E2E run failed because the test locator “Check all inputs” matched both the real button and a guided-step button. Exact-name matching fixed the test harness. Passing results above refer to the corrected run. No timing or performance benchmarks were conducted; no performance claim is made.

## Public deployment verification

**Passed on 5 November 2026.** The owner explicitly approved publishing after the local preview was presented.

- Public repository: [whybemqd/logiclab](https://github.com/whybemqd/logiclab).
- Verified public URL: [LogicLab](https://whybemqd.github.io/logiclab/).
- Successful initial workflow: [run 42051153503](https://github.com/whybemqd/logiclab/actions/runs/42051153503), commit `9e0bd37256cf8df032a0e5336cefd64090bb7d3d`.
- CI independently passed **74 unit tests**, the TypeScript/Vite production build, and **18 browser tests with 2 intentional mobile skips** on GitHub's Ubuntu runner.
- Anonymous `Invoke-WebRequest` to the public URL returned **HTTP 200**.
- Setting `LOGICLAB_BASE_URL=https://whybemqd.github.io/logiclab/` and running `npm run test:e2e` against the actual hosted application passed **18 tests, 2 intentional skips, 0 failures**. Fresh browser contexts used no authentication state.
- Public checks confirmed asset responses without 404s, no external runtime asset requests, half-adder 4/4, full-adder 8/8, broken half-adder 3/4 at the precise 11 mismatch, repair 4/4, live input changes, JSON behavior and refreshing `/logiclab/`.
- A separate in-app browser visit to the public URL observed A=B=1, Sum=0, Carry=1 and 4/4 verification.
- Verification recorded at `2026-11-05T15:07:08Z` (5 November 2026, 22:07 in Thailand).

`docs/deployment-status.json` records this verified initial application commit. Later documentation/portfolio commits do not alter its simulator behavior. No performance benchmark or physical-phone test is claimed.
