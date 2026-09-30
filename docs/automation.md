# Automation setup

The intended schedule is **daily at 03:00 America/Los_Angeles**, following daylight saving time. A Codex scheduled task attached to the setup conversation performs the research and publishes to `Charliechen1/LLM_daily_report` on `main`.

The scheduler is external to this repository. Changing `config/report.json` alone does not change the actual task schedule: update both together and verify the task in the app's Scheduled view. The host timezone must remain America/Los_Angeles for a host-local 03:00 schedule.

## Execution requirements

- Keep the computer powered on and the Codex desktop app running with the local checkout available. Local scheduled tasks require the computer and app to remain available; see [the official scheduled-task documentation](https://learn.chatgpt.com/docs/automations?surface=app).
- Keep the connected GitHub account authorized for repository writes, and keep web search available. Never put access tokens into Git.
- Read `prompts/daily-report.md` on every run so editorial changes take effect.
- Trigger time is not a guarantee of completion at 03:00. Research, verification, rendering and publication happen after the trigger.

An installation that has no published reports starts with its first elapsed scheduled cutoff. It does not invent a historical start date or backfill indefinitely; automatic catch-up concerns gaps after reporting has begun.

## Report and publication flow

1. Sync the repository without discarding existing work and determine the most recent scheduled local 03:00 cutoff that has elapsed.
2. Search all three areas, check the discovery buffer, and inspect canonical sources.
3. Review the JSON, validate, build and inspect Markdown.
4. Publish source and generated outputs together in a normal commit; verify the remote head and report.
5. Notify the owner with the published report link, or with the precise failure requiring attention. Stay quiet on duplicate/no-op retries. A complete zero-entry report may be published when the search actually completed.

If a scheduled run was missed, backfill missing daily windows in order and label any uncertainty. Do not merge several days into a report claiming to cover only one day. Before a retry, inspect the repository to avoid duplicate reports or research items.

## CI and manual operation

`.github/workflows/validate.yml` checks changes on pushes and pull requests and supports a manual check. It does not perform research, call an LLM, hold API keys, or register the daily schedule. A cloud research runner would require a separate explicit setup.

You can run the same workflow manually using the commands in the root README and the instructions in `docs/daily-workflow.md`. The source files and scripts remain usable independently of the scheduler.

If a restricted Windows sandbox raises `EPERM` while Node resolves an ancestor of the checkout, run the CLI with `node --preserve-symlinks --preserve-symlinks-main scripts/report.mjs <command>` or use an approved normal host execution. This is a sandbox path-resolution issue; do not change the research data to work around it.
