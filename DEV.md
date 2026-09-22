# Development

How to run this theme locally, lint it, and validate it.

## Prerequisites

- **Node.js 20+** and npm
- **Shopify CLI** — `shopify version` should print 3.x or later

```bash
npm install -g @shopify/cli@latest
```

You also need a Shopify store to render against. The theme pulls products, collections and
policies from a real store — there is no offline mode.

## Run it locally

```bash
shopify theme dev --store your-store.myshopify.com
```

Serves at `http://127.0.0.1:9292` with hot reload. The first run opens a browser to log in.

Your store handle is the middle part of your admin URL:
`admin.shopify.com/store/`**`fgim1k-rr`** → `fgim1k-rr.myshopify.com`. Omit `--store`
entirely and the CLI prompts you with the stores you have access to.

Useful flags:

| Flag | Effect |
|---|---|
| `--theme-editor-sync` | Pull theme-editor changes back into local files |
| `--live-reload full-page` | Reload the whole page instead of hot-swapping sections |
| `--port 9393` | Use a different port |

### If the browser shows the wrong version

Two causes, in order of likelihood:

1. **You're serving a different directory or branch.** `shopify theme dev` serves the
   directory you run it from. Confirm with `pwd` and `git branch --show-current`.
2. **Cached CSS.** Hard-refresh: Cmd+Shift+R (macOS) or Ctrl+Shift+R.


## Lint: Theme Check

Theme Check is Shopify's official linter, bundled with the CLI.

```bash
shopify theme check
```

**The raw output is unusable on this theme** — it emits ~930 offenses, almost all
`MatchingTranslations` from the 33 locale files, and prints the offending locale content
inline. Use JSON output and filter:

```bash
shopify theme check --output json > /tmp/check.json
```

Summarise by check type:

```bash
python3 -c "
import json, collections
raw = open('/tmp/check.json').read()
d = json.loads(raw[raw.find('['):])
c = collections.Counter(o['check'] for f in d for o in f.get('offenses', []))
[print(f'{v:5}  {k}') for k, v in c.most_common()]
"
```

List only real offenses, skipping the translation noise:

```bash
python3 -c "
import json, os
raw = open('/tmp/check.json').read()
d = json.loads(raw[raw.find('['):])
for f in d:
    for o in f.get('offenses', []):
        if o['check'] == 'MatchingTranslations': continue
        print(os.path.basename(f['path']), o.get('start_line'), o['severity'], o['check'], o['message'][:90])
"
```

Other useful invocations:

```bash
shopify theme check --fail-level error   # only fail CI on errors, not suggestions
shopify theme check --auto-correct       # apply the fixes it can make safely
shopify theme check --list               # show every available check
```

## CI

`.github/workflows/theme-check.yml` runs Theme Check on every pull request, and on
pushes to `main`. It needs no Shopify credentials or secrets — Theme Check is static
analysis and never contacts a store.

Those two triggers cover different things. Pull requests are the gate: nothing reaches a
branch Shopify syncs to a theme without being linted first. Pushes to `main` catch what a
PR cannot — a direct push, and the commits Shopify itself makes when someone edits the
theme in the admin. Feature branches are deliberately not linted on every push; open a
PR and the gate applies.

The job writes a JSON report, prints a summary, and fails only on **error**-severity
offenses. It grades the report rather than relying on the CLI's exit code so the log
stays readable: a plain run prints every offending locale file inline, which buries the
handful of findings that matter.

The report is uploaded as a `theme-check-report` artifact on every run, pass or fail.

### The translation baseline

`.theme-check.yml` downgrades `MatchingTranslations` from error to warning. The theme's
custom storefront strings (`beauty_*`) live only in `locales/en.default.json`, so all 33
translated locales report them missing — 924 offenses that predate CI and say nothing
about the change under review. Left at error severity, every build would be red.

Downgraded rather than disabled, so the offenses stay visible in the summary. Restore the
default severity once those keys are genuinely translated:

```yaml
# .theme-check.yml
MatchingTranslations:
  severity: warning   # delete this block to re-enable the gate
```

Adding a new `{{ 'some.key' | t }}` string adds 33 more of these. That is expected, not a
regression.

## Deploy

Which route applies depends on whether the store is connected to this repository through
the Shopify GitHub app. This repo has a remote (`Skadavil/shopify_demo`), so if the store
is connected, **pushing the branch is the deploy** — there is no separate step.

### Connected to GitHub (preferred)

Shopify maps one branch to one theme and updates that theme whenever the branch updates:

```bash
git push origin feature/abc
```

Connect a branch in the admin: **Online Store → Themes → Add theme → Connect from GitHub**.
Point a feature branch at an *unpublished* theme to preview it, then merge into the branch
backing the live theme when you're happy.

The sync is two-way, and this is the part that catches people out: every edit made in the
admin — theme editor, code editor, or an app writing to the theme — is committed back to
the connected branch by Shopify automatically. It cannot be disabled. Those commits look
like:

```
Update from Shopify for theme Dawn
Committed from shop: Snowdevil
```

So pull before you start, or your next push lands on a commit you didn't make:

```bash
git pull --rebase origin <branch>
```

Editor saves within ~10 seconds of each other are batched into one commit, and the code
editor has no conflict warning — it overwrites the GitHub version of the file. Treat the
admin and your editor as two writers to the same branch.

### Not connected to GitHub

Use the CLI:

```bash
shopify theme push --unpublished --theme "My theme"   # new unpublished theme
shopify theme push --theme <id>                       # overwrite an existing one
shopify theme list                                    # find theme IDs
shopify theme pull --theme <id>                       # pull editor changes down
```

`shopify theme push` with no flags overwrites the **live** theme. Always pass
`--unpublished` or an explicit `--theme` unless that is what you want.

Don't use both routes on the same theme. A CLI push to a GitHub-connected theme puts the
theme and its branch out of step until the next admin edit forces a sync commit.

## Where the design lives

The storefront design is a set of `beauty-*` files layered on the base Horizon theme.

| File | Holds |
|---|---|
| `assets/beauty.css` | Design tokens (`--d-ink`, `--d-accent`, `--d-gutter`), buttons, service bar |
| `assets/beauty-header.css` | Header, category bar, mega menu |
| `assets/beauty-cards.css` | Product cards — badges, rating, price |
| `assets/beauty-home.css` | Home modules — hero, rails, category circles, promo tiles |
| `assets/beauty-store.css` | Collection header, product detail, footer |

`beauty.css`, `beauty-header.css`, `beauty-cards.css` and `beauty-store.css` load globally
from `layout/theme.liquid`. `beauty-home.css` loads per section, from each home section.

Home page composition lives in `templates/index.json`; header and footer in
`sections/header-group.json` and `sections/footer-group.json`. Colour and typography
defaults are in `config/settings_data.json`.

### Palette

Black and white are primary; light pink is a secondary tint used only on surfaces — never
on text, buttons, or borders that carry meaning.

```
--d-ink            #000000   --d-surface        #f5f5f5
--d-muted          #595959   --d-accent         #f9ecef
--d-line           #e2e2e2   --d-accent-strong  #f0d8de
```

The status colours in `snippets/theme-styles-variables.liquid` (error, success, in-stock,
low-stock) are intentionally left coloured — they carry meaning, not brand.

### Known deviations from Shopify convention

Two, both deliberate — see the review notes before "fixing" either:

1. **Schema strings are literal English, not `t:` keys.** The base theme uses
   `"name": "t:names.hero"` resolved from `locales/*.schema.json`. The `beauty-*` sections
   use `"name": "Beauty banner"`. Converting them properly means authoring ~40 keys across
   23 schema locale files; a partial conversion adds hundreds of `MatchingTranslations`
   offenses. Required before a Theme Store submission, optional for a demo.
2. **Home sections load CSS with `asset_url`, not `{% stylesheet %}`.** The base theme's
   sections use `{% stylesheet %}`. The `beauty-*` sections share one `beauty-home.css`
   across five sections; `{% stylesheet %}` would duplicate it per file.
