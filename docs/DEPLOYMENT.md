Built by Olivia — https://discord.gg/ojailbreaks

# Deployment record — GitHub Pages only

**Published and verified.** The owner explicitly approved creating this new public repository and GitHub Pages deployment after the finished local preview was presented. No ChatGPT Sites project or domain has been created.

Public source: [whybemqd/logiclab](https://github.com/whybemqd/logiclab).
Verified demo: [LogicLab](https://whybemqd.github.io/logiclab/).
Successful initial workflow: [42051153503](https://github.com/whybemqd/logiclab/actions/runs/42051153503).

The authenticated GitHub CLI account is `whybemqd`. The exact repository endpoint returned 404 both before project-file creation and immediately before approved repository creation. Only the new LogicLab source directory was pushed. Pages uses `build_type=workflow` and HTTPS. See `TEST-RESULTS.md` for anonymous public acceptance results.

## Initial publishing procedure — completed

The following is the initial creation record, not an instruction to recreate the existing repository. It was executed in the project directory after approval. Source, documentation and screenshots are public. For subsequent changes, edit locally, run `npm run check`, commit and push to `main`; the included workflow tests, builds and deploys automatically.

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

## Public acceptance — completed; repeat after changes

The real URL returned by GitHub Pages was opened without signing in and returned HTTP 200. Public checks passed for bundled JS/CSS/fonts/icons without 404s, half-adder live inputs and 4/4, full-adder 8/8, broken example 3/4, repair 4/4, and page refresh. The app has no path routing, so refresh the project root `/logiclab/`, not a made-up nested route.

```powershell
$env:LOGICLAB_BASE_URL = 'https://whybemqd.github.io/logiclab/'
npm run test:e2e
Remove-Item Env:LOGICLAB_BASE_URL
```

The browser tests use fresh anonymous contexts without GitHub cookies or credentials. Actual run ID, initial application commit, URL, date and results are recorded in `TEST-RESULTS.md`. The final QR is in `docs/portfolio-assets/demo-qr.png`. Personal learning wording remains a draft independently of deployment status.

## If account access later blocks these steps

Sign in with `gh auth login --hostname github.com --git-protocol https --web`, choose the `whybemqd` account, then retry the read-only check. Never paste an access token in a source file. If an organization/account policy blocks Pages, record its exact error; do not describe the intended URL as live. The same source and workflow are ready for the owner to perform these steps through GitHub's website.
