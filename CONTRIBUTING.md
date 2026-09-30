# Contributing

Read [the editorial policy](docs/editorial-policy.md), [the taxonomy](config/taxonomy.json), and [the daily workflow](docs/daily-workflow.md) before adding research.

1. Search the historical index for the canonical work ID, arXiv ID, DOI, title and source URL.
2. Read the primary source and record publication dates, access level, evidence and limitations.
3. Use one primary category and 2–4 relevant tags. Write 2–3 short English sentences: what changed, why it matters, and optional evidence or caveat.
4. Add or correct the source JSON under `data/reports/YYYY/MM/`. Corrections should preserve provenance and explain the change in the commit message.
5. Run `npm test`, `npm run validate`, `npm run build` and `npm run check`.
6. Review generated Markdown and include generated files with the source JSON in the same commit.

Do not add placeholder reports, promotion without technical evidence, duplicated paper/blog/repository entries, or a metric without its comparison context. Avoid claims of independent reproduction unless a reproduction was actually performed.

The scripts validate structure, dates, categories and known duplicates. They cannot establish scientific quality, prove that a page was read, or verify the meaning of an English sentence; those require editorial review.
