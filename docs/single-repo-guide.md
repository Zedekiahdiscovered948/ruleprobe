## Errors Found (with evidence)

| Claim in original | Actual (from data) | Source |
|---|---|---|
| "202 instruction files from 195 repos" | **580 files from 568 repos** | `per-file-results.json`: 580 entries, 568 unique `repo` values |
| "13% extraction rate / 87% unenforceable" | **3.8% extraction rate / 96.2% non-rule** | `analysis.json`: 309 extracted / 8222 total lines |
| "917 rules extracted" | **309 rules extracted** | `all-extracted.json`: 309 entries; `analysis.json` confirms |
| "7,072 total lines" | **8,222 total lines** | `analysis.json`: `totalInstructionLines: 8222` |
| "6,155 non-rule lines" | **7,913 unparseable** | `analysis.json`: `totalUnparseable: 7913` |
| "CLAUDE.md (127), AGENTS.md (73), .cursorrules (1), GEMINI.md (1)" | **AGENTS.md 149, CLAUDE.md 111, .cursorrules 102, .windsurfrules 95, GEMINI.md 89, copilot-instructions.md 34** | `per-file-results.json` filename counts |
| "35 files had zero extractions" | **430 of 580 files (74.1%)** | `per-file-results.json`: 430 entries with `extractedCount: 0` |
| CLAUDE.md parse rate 14.1%, AGENTS.md 11.2%, .cursorrules 40.7% | CLAUDE.md 2.5%, AGENTS.md 4.9%, .cursorrules 5.2%, copilot-instructions.md 5.9% | Per-type computation from `per-file-results.json` |
| "averaging 5.5 rules per file" | **2.1 rules per file** (among files with >0 rules) | 309 rules / 150 files with extractions |
| "44.9% had parse rates above 20%" | **4.1% (24 files)** | `per-file-results.json`: 13 at 20-29% + 11 at 30-49% = 24/580 |
| Names ClickHouse, Deno, PostHog, Expo | **Not in the dataset** | `per-file-results.json` has no matching repos for these orgs |
| "unjs/* repos all had CLAUDE.md" | **No unjs repos in dataset** | Zero matches for "unjs" in `per-file-results.json` |
| Excalidraw 16 rules, 81.2% | **9 rules, 66.1% deterministic / 71.3% semantic avg** | `e2e-verification-report.md` section 2: 9 verdicts listed |
| PostHog 15 rules, 80% | **4 rules, 25% deterministic** | `e2e-verification-report.md` section 3 |
| Codex 9 rules, Zed 7 rules, Cline 5 rules | **No data in any data file** | Not in `e2e-verification-report.md` or any other report file |
| "73% of rules were non-structural" | **Cannot verify** from available data files; the E2E report only covers excalidraw (9 rules) and PostHog (4 rules), total 13 rules, not 52 |
| "$0.06 total across 5 repos" | **$0.00 for excalidraw** (all fast-path); PostHog also 0 LLM calls; other 3 repos unverifiable | `e2e-verification-report.md` section 4 |

---

## Corrected Post

```
---
title: We Parsed 580 AI Instruction Files. 96% of the Content Can't Be Verified.
published: false
description: Analysis of real CLAUDE.md, AGENTS.md, .cursorrules, and other instruction files from 568 GitHub repos. Almost everything you write in instruction files is unenforceable.
tags: ai, programming, typescript, opensource
cover_image: https://your-cover-image-url.png
---

Every AI coding agent reads an instruction file. CLAUDE.md, AGENTS.md, .cursorrules, whatever your agent uses. You write rules in it. The agent says "Done." And you have no idea whether it followed any of them.

We wanted to know what's actually inside these files. Not what people think they contain, but what a machine can extract and verify. So we scraped instruction files from 568 public GitHub repos with 10+ stars, ran them through a parser that identifies machine-verifiable rules, and counted what came out.

The short version: 3.8% of the lines in a typical instruction file are verifiable coding rules. The other 96% is markdown headers, code examples, project descriptions, build commands, agent behavior directives, and contextual prose.

## The dataset

580 instruction files from 568 repos, including Sentry (43k stars), PingCAP/TiDB (40k), Lerna (36k), Dragonfly (30k), Kubernetes/kops (17k), javascript-obfuscator (16k), RabbitMQ (14k), Google APIs (14k), Redpanda (12k), Cloudflare (947/725), and hundreds of others. A mix of six file formats: AGENTS.md (149 files), CLAUDE.md (111), .cursorrules (102), .windsurfrules (95), GEMINI.md (89), and copilot-instructions.md (34).

The parser reads each file and classifies every line: is this a rule that can be checked against code, or is it something else? "Something else" includes headers, blank lines, code blocks, explanatory prose, build instructions, and agent personality configuration.

{% card %}
Corpus stats: 8,222 total instruction lines parsed. 309 rules extracted. 7,913 lines classified as non-rule content.
{% endcard %}

## What instruction files actually contain

The 96% that isn't rules breaks down into several categories. Some of it is necessary context (project structure explanations, build command documentation). Some of it is agent behavior configuration ("be succinct," "avoid providing explanations"). Some of it is just markdown formatting overhead.

Here's what stood out: 430 of the 580 files (74%) had zero extractable rules. Of those, 67 were completely empty to the parser: zero extracted, zero unparseable. Many were single-line redirects. Dragonfly's .cursorrules (30k stars) says "READ AGENTS.md." Umi's .cursorrules (16k stars) contains the single word "RULE.md." Mautic's GEMINI.md says "Read and follow all instructions in ./AGENTS.md."

At the other end, some files were almost entirely rules. Apache Skywalking-java's CLAUDE.md extracted 6 rules from 26 lines (23%). Cloudflare chanfana's AGENTS.md: 5 rules from 21 lines (24%). But those files tend to be short, focused lists of concrete instructions.

The heavy files tell a different story. javascript-obfuscator's CLAUDE.md (16k stars): 197 lines, zero rules extracted. JunDamin/hwpapi's CLAUDE.md: 100 lines, zero rules. These files are documentation with no machine-verifiable instructions embedded.

{% details Parse rate distribution across all 580 files %}

| Parse Rate | Files | Percentage |
|-----------|------:|----------:|
| 0% (no rules) | 430 | 74.1% |
| 1-9% | 70 | 12.1% |
| 10-19% | 54 | 9.3% |
| 20-29% | 13 | 2.2% |
| 30-49% | 11 | 1.9% |
| >= 80% | 2 | 0.3% |

Only 2 files (0.3%) had parse rates at or above 80%. Nearly three quarters had zero.

{% enddetails %}

## Types of content the parser correctly skips

This is worth clarifying because "3.8% extraction rate" sounds like the parser is broken. It isn't. These are lines that genuinely aren't rules:

Markdown structure (headers, horizontal rules, blank lines). Code examples showing how to use a function or run a command. Project descriptions explaining what the repo does. Build and deployment instructions. Links to external documentation. Agent behavior directives that have no code-level representation ("be concise," "ask before making changes"). Workflow instructions ("use this branch strategy," "run tests before pushing").

The parser isn't failing on these. It's correctly identifying them as not-rules. The denominator is every line in the file, not every line that looks like it could be a rule.

## What a "verifiable rule" looks like

The 309 rules that did get extracted map to concrete checks. Things like:

- "Use camelCase for function names" (AST naming check)
- "No any types" (TypeScript type safety check)
- "Use named exports, not default exports" (import pattern check)
- "Prefer const over let" (preference ratio check)
- "Test files must exist for every source file" (filesystem check)
- "Use Yarn, not npm" (tooling check)

Each rule gets a category, a verifier type (AST, filesystem, regex, tree-sitter, preference, tooling, config-file, or git-history), and a qualifier (always, prefer, when-possible, avoid-unless, try-to, never).

{% details Rule extraction by category %}

| Category | Rules Extracted |
|----------|------:|
| naming | 169 |
| structure | 44 |
| code-style | 29 |
| forbidden-pattern | 24 |
| type-safety | 20 |
| dependency | 12 |
| error-handling | 5 |
| import-pattern | 4 |
| test-requirement | 2 |

Naming rules dominate: 55% of all extracted rules. This makes sense. "Use camelCase" and "use kebab-case filenames" are the most concrete, unambiguous instructions people write.

{% enddetails %}

{% details Rule extraction by instruction file type %}

| Type | Files | Files with Rules | Rules Extracted | Total Lines | Rate |
|------|------:|------:|------:|------:|------:|
| AGENTS.md | 149 | 49 | 97 | 1,961 | 4.9% |
| CLAUDE.md | 111 | 20 | 38 | 1,501 | 2.5% |
| .cursorrules | 102 | 37 | 79 | 1,508 | 5.2% |
| .windsurfrules | 95 | 22 | 50 | 1,866 | 2.7% |
| GEMINI.md | 89 | 9 | 12 | 830 | 1.4% |
| copilot-instructions.md | 34 | 13 | 33 | 556 | 5.9% |

copilot-instructions.md had the highest extraction rate (5.9%), likely because those files are typically shorter and more prescriptive. GEMINI.md files had the lowest (1.4%).

{% enddetails %}

## E2E verification: does excalidraw follow its own instruction files?

We ran the full pipeline on excalidraw (~95k stars): parse the instruction files, then verify the actual codebase against the extracted rules. Excalidraw has both a CLAUDE.md and a copilot-instructions.md.

The parser found 9 verifiable rules across both files. Deterministic analysis scored 66.1% compliance. Semantic analysis (structural fingerprinting of 626 source files) produced 9 verdicts, all resolved via fast-path vector similarity with zero LLM calls and zero cost:

| Rule | Compliance | Method |
|------|-----------|--------|
| Prefer functional components | 0.976 | structural-fast-path |
| PascalCase type naming | 0.976 | structural-fast-path |
| Async try/catch usage | 0.983 | structural-fast-path |
| Contextual error logging | 0.979 | structural-fast-path |
| Yarn as package manager | 0.50 | no matching topic |
| TypeScript required | 0.50 | no matching topic |
| Optional chaining preference | 0.50 | no matching topic |
| camelCase variables | 0.50 | no matching topic |
| UPPER_CASE constants | 0.50 | no matching topic |

Rules that match established code pattern topics (component-structure, error-handling) score 0.97+, meaning the codebase's structural fingerprint strongly matches the instruction. Rules about tooling or naming conventions that don't map to structural AST patterns get a neutral 0.50.

The privacy test confirmed: 626 files scanned, all file IDs are opaque sequential integers, no source code strings, file paths, variable names, or comments appear in any payload sent to an LLM. In this case, no LLM was even called.

## What this means for anyone writing instruction files

If you're writing a CLAUDE.md or AGENTS.md right now, roughly 96% of what you type can't be mechanically verified. That doesn't mean it's useless. Agent behavior configuration, project context, workflow documentation all have value. But if you think you're writing enforceable rules, you're probably writing documentation.

To write rules that can actually be checked:

**Use imperative verbs with specific targets.** "Use camelCase for all function names" is verifiable. "Follow good naming conventions" isn't.

**Specify the tool or pattern, not the principle.** "Prefer const over let" is a ratio check. "Write immutable code" is philosophy.

**Include the file patterns your rules apply to.** "All .ts files must use named exports" scopes the check. "Use named exports" is vague.

**Keep rules and documentation separate.** Rules are instructions. Documentation explains why. Mixing them dilutes both.

{% cta https://github.com/moonrunnerkc/ruleprobe %}
RuleProbe on GitHub: parse your own instruction files and see what's actually verifiable
{% endcta %}

## The tool

RuleProbe is the parser and verifier behind this analysis. It reads 7 instruction file formats, extracts machine-verifiable rules using 102 built-in matchers across 14 categories, and checks agent output against each one. Deterministic by default, no API keys needed for the core pipeline. Optional semantic analysis for pattern-matching and consistency rules.

```bash
npx ruleprobe parse CLAUDE.md --show-unparseable
npx ruleprobe verify CLAUDE.md ./src --format summary
```

The `--show-unparseable` flag shows you exactly which lines were skipped and why. That's often the most useful output: it tells you which of your "rules" aren't rules at all.

{% embed https://github.com/moonrunnerkc/ruleprobe %}
```

---

## Evidence Index

Every number in the corrected post maps to a data file:

| Claim | Source file | How to verify |
|---|---|---|
| 580 files, 568 repos | `scraped-instructions/per-file-results.json` | `len(data)` = 580, `len(set(repo))` = 568 |
| 8,222 total lines | `scraped-instructions/analysis.json` | `totalInstructionLines: 8222` |
| 309 rules extracted | `scraped-instructions/all-extracted.json` | `len(data)` = 309 |
| 7,913 unparseable | `scraped-instructions/analysis.json` | `totalUnparseable: 7913` |
| 3.8% extraction rate | computed | 309 / 8222 = 0.0376 |
| 430 files zero extraction | `per-file-results.json` | count where `extractedCount == 0` |
| 67 files 0/0 | `per-file-results.json` | count where both counts are 0 |
| File type breakdown | `per-file-results.json` | count by filename pattern |
| Per-type rates | `per-file-results.json` | sum extracted/total per type |
| Category distribution | `all-extracted.json` | count by `category` field |
| Parse rate distribution | `per-file-results.json` | bucket by `extractionRate` field (integer %) |
| Named repos (Sentry 43k, TiDB 40k, etc.) | `per-file-results.json` | sort by `stars` field |
| Redirect examples (Dragonfly, Umi, Mautic) | `scraped-instructions/files/` | actual file content verified |
| 102 matchers, 14 categories | `docs/matchers.md` | category summary table sums to 102 |
| Excalidraw 9 rules, 66.1% | `docs/verification/e2e-verification-report.md` sect. 2 | verbatim from report |
| Excalidraw 9 semantic verdicts, 0 LLM calls | `e2e-verification-report.md` sect. 2 + 4 | verbatim |
| Excalidraw verdict scores (0.976, 0.983, etc.) | `e2e-verification-report.md` sect. 2 | verdict table |
| Privacy: 626 files, opaque IDs, 13 patterns passed | `e2e-verification-report.md` sect. 5 | verbatim |
