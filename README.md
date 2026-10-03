# LLM Daily Report

A daily research digest covering **LLM Recipe**, **AI Agent Dev**, and **AI Training & Inference Infra**. Each selected contribution gets **2–3 sentences** explaining what was done, why it matters, and, when needed, the key evidence or limitation.

**[Current landscape](landscape/2026-09-29.md) · [Daily deltas](reports/README.md) · [Browse topics](topics/README.md) · [Editorial policy](docs/editorial-policy.md)**

Start with the **2026-09-29 landscape baseline**. It distinguishes established methods, inspectable open references, and frontier research across all 26 topics. Every item includes primary paper, technical blog and/or code links. Daily delta reports begin **2026-09-30 at 03:00 America/Los_Angeles** and compare against both the baseline and prior daily reports.

## Coverage

| Area | Focus | Topics |
| --- | --- | --- |
| LLM Recipe | Training methods and model capability | 10 |
| AI Agent Dev | Agent methods, task execution and reliability | 8 |
| AI Training & Inference Infra | Efficient training, generation and serving | 8 |

The complete hierarchy lives in [`config/taxonomy.json`](config/taxonomy.json) and the [topic index](topics/README.md). Each work has one primary category and 2–4 cross-cutting tags. Classification follows the main contribution: an agent RL algorithm belongs to Recipe, a skill-learning mechanism to Agent Dev, and rollout scheduling to Infra.

## Daily report contract

- **Schedule:** 03:00 in `America/Los_Angeles`, following daylight saving time.
- **Coverage:** the preceding local 03:00 to the report date's 03:00. DST transition days contain 23 or 25 hours; ordinary days contain 24.
- **Freshness:** search the 72 hours ending at the daily cutoff, including the main daily window, for indexing delays. Older discoveries are labeled and deduplicated against history.
- **Selection:** up to 10 substantive contributions; no minimum and no per-category quotas. Empty topics are omitted from daily reports.
- **Evidence:** link primary sources, read the research, distinguish reported results from independent verification, and label abstract-only access.
- **Integrity:** no invented research, dates, metrics, access claims or successful search coverage. Partial retrieval is visible in the report.

The baseline is a dated map of the field, not a claim that historical references were published today. "Frontier research" is not a blanket SoTA certification; reported best results retain their evaluation scope and limitations. Templates and test fixtures are never published as research reports.

## Repository layout

```text
config/                 Taxonomy, report policy and discovery starting points
data/reports/YYYY/MM/    Reviewed JSON reports: the source of truth
data/landscapes/         Reviewed, dated landscape baselines
data/index.json         Generated research index for deduplication and browsing
reports/YYYY/MM/         Generated daily Markdown reports
landscape/              Generated landscape snapshots
topics/                 Generated indexes for all 3 areas and 26 subdomains
schemas/                Machine-readable report contract
templates/              JSON and Markdown authoring examples
prompts/                Repeatable daily research instructions
docs/                   Editorial policy and operating workflow
scripts/                Dependency-free validation and rendering CLI
tests/                  Validation, rendering and date-boundary checks
.github/workflows/      CI checks on pushes and pull requests
```

## Local usage

Requires Node.js 22 or later; no packages or API keys are needed for the local tools.

```sh
npm test
npm run validate
npm run build
npm run check
```

Create a draft for a specific report date:

```sh
npm run new -- 2026-10-01
```

The draft is created in ignored `drafts/`. Research and review it before placing it at `data/reports/YYYY/MM/YYYY-MM-DD.json`. Then run validation and build, review the diff, and commit the source JSON with all generated outputs. Do not edit generated reports or indexes directly.

## Automation

The scheduled researcher reads [`prompts/daily-report.md`](prompts/daily-report.md), searches current primary sources, compares them with the baseline and daily archive, writes the structured delta report, validates it, rebuilds the indexes, and publishes a normal commit to this repository. GitHub Actions checks repository integrity; it does not generate research or call a model.

After publication, selected papers may receive English, diagram-rich PNG lecture handouts in the privately configured Google Drive destination. Selection has no quota; handouts are optional and do not block the daily report. See [the visual handout workflow](docs/visual-handouts.md) for teaching, evidence, review, and delivery requirements.

The schedule is managed by a Codex task outside Git; [`config/report.json`](config/report.json) records the intended timezone and time but does not itself register a scheduler. See [automation setup](docs/automation.md) for current setup and execution requirements.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The key acceptance test is whether a reader can understand the contribution and its usefulness in seconds, then verify the claims at the linked source.
