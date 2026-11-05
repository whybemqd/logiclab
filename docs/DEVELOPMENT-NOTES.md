Built by Olivia — https://discord.gg/ojailbreaks

# Development and contribution record

## Initial build — 5 November 2026

The applicant supplied the project requirements, intended KMUTNB Computer Engineering portfolio context, electronics background, desired technology, GitHub username and explicit pre-publication approval requirement. These are confirmed conversation inputs, not a claim of code authorship.

AI assistance produced the initial React/TypeScript implementation, engine, examples, independent literal reference tables, unit tests, browser tests, styling, deployment workflow and draft learning/portfolio materials. AI operated the tools that installed dependencies and ran the recorded tests/build/browser demonstration. The applicant has not yet supplied personal edits, personal test output or exercise answers in this session.

Milestones and corrections:

- Before writing project files, an authenticated GitHub API request to `repos/whybemqd/logiclab` returned 404. No existing repository was changed.
- Half-adder milestone: `npx vitest run tests/half-adder.test.ts` passed 5 tests before the interface was added.
- Extended engine/persistence suite passed 74 tests.
- The first production build reported an extra parenthesis in the gate selector JSX. AI corrected it; TypeScript and Vite subsequently passed.
- Initial browser checks used an ambiguous text locator for “Check all inputs,” which also matched a guided-step control. AI changed the locator to an exact accessible name. These initial failures are not counted as passing tests.
- Corrected browser suite passed 18 tests with 2 intentional mobile skips for desktop editing interactions. The phone example/toggle/verification/import workflows were exercised.
- An additional manual in-app browser demonstration observed half-adder 4/4, broken half-adder 3/4 with the 11 mismatch, and repaired half-adder 4/4.
- After the owner explicitly approved publication, AI created the new public `whybemqd/logiclab` repository, configured GitHub Actions publishing, pushed the source and monitored successful workflow run `42051153503`. Git identity was initially absent; a repository-local username and GitHub noreply address were configured without changing global Git settings.
- CI passed 74 unit tests, the build, and 18 browser tests with 2 intentional mobile skips. The deployed `https://whybemqd.github.io/logiclab/` returned anonymous HTTP 200 and separately passed the same 18 public browser tests. Public captures and a QR for that verified URL were then prepared.
- No exercise answers or applicant-performed code/test evidence have been recorded. Personal learning/contribution wording remains a draft; the exercises do not block hosting or use of the application.

## Applicant work log — fill only after performing the work

| Date actually performed | Exercise or change | My explanation | Files I changed | Commands I ran | Actual result/evidence | Help received |
|---|---|---|---|---|---|---|
| Not yet recorded | — | — | — | — | — | — |

Record failed tests too. A useful entry states what you predicted, what happened, what you changed, and why. Keep the actual diff and test output. No entry should copy the AI's execution and label it as the applicant's personal execution.

## Wording available now

“โครงงานซอฟต์แวร์เพื่อการศึกษา LogicLab ใช้ AI ช่วยสร้างโค้ดและการทดสอบตามข้อกำหนดที่ให้ไว้ เพื่อเชื่อมความรู้วงจรดิจิทัลกับการเขียนโปรแกรม ขณะนี้อยู่ในขั้นฝึกอธิบาย แก้ไข และทดสอบด้วยตนเอง”

## Wording to complete after exercise review

“ผม/ดิฉันใช้ AI ช่วยในส่วน [ระบุจริง] และลงมือ [อธิบาย/แก้ไฟล์/เพิ่ม test ที่ทำจริง] ด้วยตนเอง หลักฐานคือ [diff และผลทดสอบจริง] ผม/ดิฉันอธิบาย [แนวคิดที่ตอบได้จริง] ได้ และยังต้องฝึก [เรื่องที่ยังติด]”

Do not finalize or submit this second statement until the applicant's answers and actual change/test evidence have been reviewed. Attribution is separate from an evidence-based statement of personal contribution.
