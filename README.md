Built by Olivia — https://discord.gg/ojailbreaks

# LogicLab — โปรแกรมจำลองและตรวจสอบวงจรดิจิทัล

Educational digital-logic simulator made with React, TypeScript and Vite. Editing uses React Flow. The simulation engine has no React or browser dependencies. Simulation, verification and JSON processing run in the visitor's browser. Thai fonts, icons, JavaScript and CSS are bundled; no API keys, paid services or runtime CDN are required.

**Publishing status: local application complete; awaiting owner's approval.**

Proposed new public repository: `https://github.com/whybemqd/logiclab`.
Proposed GitHub Pages address: `https://whybemqd.github.io/logiclab/`.
These are intended destinations, not claims of an existing repository or deployed site. GitHub CLI authenticated as `whybemqd`; the exact repository API returned 404 before any project files were created. Recheck immediately before creation.

## Windows setup

Install Node.js 22 LTS, version 22.12 or newer within the 22.x line, from [nodejs.org](https://nodejs.org/en/download). The initial local checks used Node 22.14.0. Open PowerShell in this project directory (the folder containing `package.json`):

```powershell
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173/logiclab/`. Keep the terminal running. To stop the development server, press Ctrl+C. A local server stops being available when your computer is off; GitHub Pages will serve the approved published build independently.

Production preview and tests:

```powershell
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

`npm run build` runs TypeScript checks and creates `dist/`. `npm run test:e2e` automatically starts a production preview if port 4173 is free; stop another unrelated server on that port first. The preview URL is `http://127.0.0.1:4173/logiclab/`. Do not open `dist/index.html` through `file://`.

For Linux CI, install the browser with `npx playwright install --with-deps chromium`. `npm run check` runs unit tests, build and browser tests in order. The dependency lockfile is included; use `npm ci` for repeatable installation.

## Try it

1. Click **Try the half-adder**. Toggle **A** and **B** in the Live Signals panel or directly on the circuit.
2. Observe Sum and Carry. Wires show both colour and visible `0`, `1`, or `?` labels.
3. Click **Check all inputs**. The half-adder must show **4 passed, 0 failed**.
4. Click **Try a broken circuit**, then **Check all inputs**. Only `A=1, B=1` fails: expected Sum `0`, actual Sum `1`.
5. Click the OR gate, change **Gate type** to XOR, and verify again. The shortcut **ซ่อม Sum → XOR** performs the same repair.
6. Load **Full-adder** and verify all **8** combinations.

On phones, use the Live Signals panel above the canvas. Truth tables scroll horizontally so every Expected, Actual and Result column is accessible. Detailed circuit editing is intended for desktop.

## Editing and files

Click a component in the left palette to add it. Drag a component to move it. Drag a right output handle onto a left input handle to connect it. Each input accepts exactly one driver; one source may drive several distinct inputs. Select a component or wire and click **ลบที่เลือก**, or press Delete/Backspace. Select a gate to change its type. Changing a two-input gate to NOT removes its second input wire.

**Reset example** reloads the currently selected supplied example, including its original input states and expected table. After a JSON import, reset still returns to the most recently selected supplied example. Reloading the page starts a fresh half-adder. There is no automatic persistence: save JSON before leaving to retain edits.

**Save JSON** downloads a versioned file containing components, wires, positions, switch states and an optional independent Expected table. **Load JSON** validates the complete file before replacing the current circuit. Unknown versions, invalid IDs/kinds/coordinates, excessive sizes, duplicate IDs, invalid wires, multiple drivers, loops and malformed Expected tables produce errors. An incomplete but structurally valid graph can be saved and reopened for editing; evaluation still refuses it.

For a custom circuit, click **กำหนด Expected**. Enter all output bits for every input combination using your own hand calculation or separate specification. Every cell must be explicit. Use **ล้าง Expected** to generate an Actual-only truth table without claiming a pass. Changing Input or Output IDs/counts requires a new matching Expected table; validation explains this rather than guessing.

## Algorithm and boundaries

`src/engine/types.ts` defines plain data. `simulate.ts` validates the graph, checks port arity and drivers, and uses Kahn's topological sort. A node is evaluated only when its upstream values exist. If the sort cannot visit every component, feedback is present. Required unconnected ports are errors, never valid zeros. On an invalid graph, input switches retain their known values and computed outputs show `?`.

`verify.ts` enumerates all `2^n` input vectors, calls the actual evaluator for each, and compares against independent reference rows. `examples.ts` contains explicitly written half-adder and full-adder reference tables. The broken circuit keeps the correct half-adder reference. `ExpectedEditor.tsx` lets visitors supply a different independent reference without deriving it from Actual.

Limits: 6 input switches, 48 components, 96 wires, 8 output indicators, 256 KiB JSON file, 64 verification cases. Two-input AND/OR/XOR, one-input NOT/OUTPUT, and binary INPUT are supported. Only combinational logic states are modeled: no voltage, current, resistance, propagation delays, clock, flip-flop, timing hazards, high impedance or electrical safety analysis. A passing truth table proves agreement with the entered reference over the enumerated binary inputs; an incorrect reference can still give a misleading conclusion.

## Tests and evidence

See [actual local test results](docs/TEST-RESULTS.md), [learning guide](docs/LEARNING-GUIDE.md), [exercises](docs/EXERCISES.md), [separate answers](docs/ANSWERS.md) and [contribution record](docs/DEVELOPMENT-NOTES.md).

Screenshots in `docs/screenshots/` are actual captures from the local production application. Desktop and Chromium mobile-emulation workflows are tested; this is not a claim of testing a physical Android/iPhone or every browser.

## GitHub Pages

The project-site base is `/logiclab/` in `vite.config.ts`. The workflow tests and builds before deploying `dist/`, with a `github-pages` environment and Pages/OIDC deployment permissions. Pull requests test but do not deploy. The site uses no path router; hash links and refreshing `/logiclab/` work without special rewrite rules.

See [publishing steps and approval boundary](docs/DEPLOYMENT.md). After deployment, run the browser suite against the real URL and independently open it without authentication:

```powershell
$env:LOGICLAB_BASE_URL = 'https://whybemqd.github.io/logiclab/'
npm run test:e2e
Remove-Item Env:LOGICLAB_BASE_URL
```

Official documentation checked on 5 November 2026: [Vite project-site base and Pages deployment](https://vite.dev/guide/static-deploy.html#github-pages), [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [React Flow custom handles](https://reactflow.dev/learn/customization/handles), [React Flow TypeScript](https://reactflow.dev/learn/advanced-use/typescript), [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro). Workflow action release tags were checked against the official `actions/*` repository release APIs.

## Portfolio and authorship

[Page 11 Thai draft](docs/PORTFOLIO-PAGE-11.md) includes factual project copy, local evidence and a 60–90 second demonstration script. Public URL, final QR and personal learning claims remain pending until publication verification and a student exercise review. AI created this initial implementation and ran the recorded local checks. Do not claim those were independently written or personally tested by the applicant. Record later student changes and tests separately.

The attribution above is the supplied project credit. It does not establish that the applicant personally wrote or tested the code. Third-party notices are in [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
