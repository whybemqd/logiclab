Built by Olivia — https://discord.gg/ojailbreaks

# Publishing plan — GitHub Pages only

**Status: not published. Approval is required by the original project request after the finished preview is presented.** The later clarification confirms GitHub hosting and does not remove that review step. No ChatGPT Sites project or domain has been created.

Exact proposed new public repository: `https://github.com/whybemqd/logiclab`.
Exact intended public demo URL: `https://whybemqd.github.io/logiclab/`.

The authenticated local GitHub CLI is available as `whybemqd`. No account-access blocker was observed during the initial check. The repository endpoint returned 404 before project creation; recheck it immediately before creating the repository. If it now exists, stop and resolve the name conflict; do not reuse or overwrite it.

## After approval

Run in the project directory only. These commands publish source code and included documentation/screenshots publicly. Do not run before the owner approves this exact destination and preview.

```powershell
# Read-only recheck: a 404 is required. A 200 means stop.
gh api repos/whybemqd/logiclab

# Create an empty NEW public repository. Do not use an existing repo.
gh repo create whybemqd/logiclab --public --description 'LogicLab — educational digital-logic simulator and exhaustive truth-table checker'

# Create a local Git repo if this source directory has none.
git init -b main
git add .
git diff --cached --stat
git commit -m 'Build LogicLab educational circuit simulator [skip ci]'
git remote add origin https://github.com/whybemqd/logiclab.git

# Initial source push skips the push-triggered workflow while Pages is set up.
git push -u origin main
# Select GitHub Actions as the Pages source, then explicitly run the tested workflow.
gh api --method POST repos/whybemqd/logiclab/pages -f build_type=workflow
gh workflow run deploy.yml --repo whybemqd/logiclab --ref main
gh run list --repo whybemqd/logiclab --limit 1
# Use the actual returned run ID:
gh run watch RUN_ID --repo whybemqd/logiclab --exit-status
gh api repos/whybemqd/logiclab/pages --jq '{status: .status, url: .html_url, build_type: .build_type}'
```

The initial `[skip ci]` marker skips push-triggered checks only; the explicit `workflow_dispatch` still runs all tests, the build and deployment. This sequencing ensures the main branch exists before Pages setup. See [GitHub's skip-workflow documentation](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs) and [Pages API documentation](https://docs.github.com/en/rest/pages/pages#create-a-github-pages-site). Do not repeatedly create repositories. If the Pages site already exists due to a successful first call, read it and use PUT only for this new approved repository.

Browser equivalent: open the new repository → Settings → Pages → Build and deployment → Source **GitHub Actions**. Under Actions → General, permit the included workflow if account settings require it. The workflow grants only read access in the build job and Pages/OIDC write access in the deployment job. The `github-pages` environment may request approval if the account has protection rules; satisfy those in GitHub without weakening unrelated settings.

## Acceptance after the deployment is actually successful

Open the **real URL returned by GitHub Pages** without signing in. Confirm HTTP 200, bundled JS/CSS/fonts/icons without 404s, half-adder live inputs, 4/4 and full-adder 8/8, broken example 3/4, repair 4/4, and page refresh. The app has no path routing, so refresh the project root `/logiclab/`, not a made-up nested route.

```powershell
$env:LOGICLAB_BASE_URL = 'https://whybemqd.github.io/logiclab/'
npm run test:e2e
Remove-Item Env:LOGICLAB_BASE_URL
```

The browser tests create fresh anonymous contexts without GitHub cookies or credentials. Record actual successful run ID, commit, returned URL, date and browser results in `TEST-RESULTS.md`. Only then change the README to deployed, replace draft URL wording, and generate the final QR. Update the portfolio's personal learning claims only after the exercise review too.

## If account access later blocks these steps

Sign in with `gh auth login --hostname github.com --git-protocol https --web`, choose the `whybemqd` account, then retry the read-only check. Never paste an access token in a source file. If an organization/account policy blocks Pages, record its exact error; do not describe the intended URL as live. The same source and workflow are ready for the owner to perform these steps through GitHub's website.
