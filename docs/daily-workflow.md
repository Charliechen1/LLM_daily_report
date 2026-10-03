# Daily workflow

The daily research run is scheduled through a **Codex task heartbeat** at **03:00 America/Los_Angeles**, including daylight saving changes. The scheduler configuration lives in Codex, while this repository stores the research policy, task prompt, structured reports, and generated reading views. This is a local execution workflow: the configured computer and Codex environment must be available. The repository alone is not an independent cloud executor.

The reusable task instructions are in [the daily prompt](../prompts/daily-report.md). Read [the editorial policy](editorial-policy.md) before collecting research.

## 1. Prepare and establish coverage

1. Enter the local checkout and read `AGENTS.md`, `config/report.json`, `config/taxonomy.json`, and `config/sources.json`.
2. Check the working tree and remote. Preserve unrelated local changes. Fetch the remote and fast-forward the intended publishing branch before starting; do not reset or overwrite another contributor's work.
3. Read `data/landscapes/2026-09-29.json` and the complete `data/index.json` research registry. Check daily report records for the report date, prior coverage, canonical IDs, and unfinished intervals. Daily deltas begin on `config/report.json`'s `delta_start_date` (2026-09-30); never backfill earlier dates. Re-running a date should repair or complete its report without duplicating items.
4. Set the report date to the most recent local scheduled 03:00 cutoff that has elapsed. Coverage is the previous scheduled 03:00 through that date's 03:00; backfill missed dates as separate fixed daily windows. Keep the actual `generated_at` separate from the coverage endpoint. Review the 72 hours ending at `coverage.end` for delayed discoveries.

## 2. Discover and review

Search all three top-level domains using authoritative primary sources, such as paper repositories, conference proceedings, research organization publications, and linked author repositories. The catalog in `config/sources.json` supplies starting points, not an exhaustive list or endorsements. Check publication dates and original source content. Secondary indexes can help discovery but do not replace evidence review.

Maintain a candidate list with canonical ID, actual publication date, primary links, domain, novelty, evidence access, and selection rationale. Compare candidates across all three groups before selecting at most 10. There is no minimum. Do not include filler to balance the categories.

Read available full text and inspect material supporting the summary. Clearly identify abstract-only candidates as low confidence. Record unavailable sources as unavailable; distinguish a partial search from a complete search and an outright failure.

## 3. Author structured source data

Create a draft with:

```sh
node scripts/report.mjs new YYYY-MM-DD
```

This creates `drafts/YYYY-MM-DD.json`. Replace every placeholder with reviewed source information. The source-of-truth record belongs at `data/reports/YYYY/MM/YYYY-MM-DD.json` after editorial review. The draft folder is not a publication destination.

Required report fields are `schema_version` (1), `date`, `timezone`, `generated_at`, `coverage`, `search`, and `entries`. Use `timezone: "America/Los_Angeles"`; `search.status` is `complete` or `partial`. Each source check includes `name`, `url`, and `status` (`ok` or `unavailable`).

Each entry contains `id`, `title`, a taxonomy `category`, 2–4 `tags`, `published_on`, `first_seen_at`, `canonical_url`, `links`, a 2–3 sentence English `summary`, `evidence`, and `novelty`. Evidence records its type (`research-paper`, `technical-report`, or `engineering-report`), access (`full-text` or `abstract-only`), rationale, and limitations. Novelty is `new`, `newly-discovered`, or `material-update`; a material update also requires `update_note`.

Do not copy the illustrative Markdown template into the published archive. Generate reading views from reviewed JSON so daily reports and topic indexes stay consistent.

## 4. Validate and publish

Run the repository checks after moving reviewed data into the archive:

```sh
npm test
npm run validate
npm run build
npm run check
```

Review the generated daily report, topic indexes, and `git diff`. Confirm source dates, category placement, distinct canonical IDs, coverage, the visible search status, 2–3 English sentences per item, and accurate links. Ensure no placeholder text, secrets, unrelated edits, or fabricated reports are included.

Stage only the exact intended source and generated files. Commit the daily update to `main` and push to the configured `origin`; this publication is authorized by the repository owner. Never force push. If Git CLI authentication is unavailable, use the connected GitHub tools to build a tree on the current remote base tree, create a commit with that head as parent, and update `main` without force. A successful local commit is not a successful publication: confirm the remote commit and report file.

If another commit reaches the remote first, fetch, rebase only the run's own commit onto the updated `origin/main`, then re-check existing IDs and coverage, regenerate the reports, run all checks, and review the resulting diff before retrying. Resolve routine conflicts only when the intended result is clear. Preserve unrelated work and request help for ambiguous conflicts.

## 5. Prepare optional visual handouts

After verifying publication, follow [the visual handout workflow](visual-handouts.md). Select zero, one, or multiple items from that date's published report based on teaching value, originality, evidence, and practical value. Read the full source before teaching; abstract-only items are ineligible. Produce clear English, diagram-rich PNG pages, visually review every page, and upload them to the privately configured Drive destination under `YYYY-MM-DD/paper_name/`.

Track selection, rendering, review, and verified uploads in ignored `drafts/handouts/state.json`. List Drive contents before creating folders or files, reuse stable names, and resume missing outputs without duplicates. A published report does not mean its handouts are complete: a rerun must check both states. Record a local reason when zero items are selected. Handout failure does not block a valid daily report, and private Drive IDs or links must not enter Git.

## 6. Report the outcome and recover

After success, report the published date, number of selected items, any search gaps, and the repository/report link. A complete search with no qualifying results may publish an explicitly empty report; it must still show its coverage and checked sources.

Report completed handouts separately with paper titles, page counts, and Drive links in the private task response. If handouts remain incomplete, state the remaining step without describing the daily report itself as unpublished. A no-op requires both verified report publication and completed handout selection/delivery, including a recorded zero-item decision when applicable.

If meaningful research cannot proceed, keep a local failure note in the ignored `drafts/` directory with the attempted coverage and reason. If validation or publication fails, preserve the reviewed data and explain the exact remaining blocker. Notify the user when action is required. Never claim that a report was published when the push failed, or silently convert a failure into an empty success. The next run must revisit uncovered or partial intervals.
