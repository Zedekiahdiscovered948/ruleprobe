# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-04-07

14 commits, 100 files changed, +9,017 lines since v0.1.0.

### Breaking Changes

- `verifyOutput` is now async. Returns `Promise<RuleResult[]>` instead of `RuleResult[]`. Callers must `await` it.
- `RuleCategory` union expanded from 5 to 9 members: added `error-handling`, `type-safety`, `code-style`, `dependency`. Exhaustive `switch` statements and `Record<RuleCategory, ...>` types need updating.
- `VerifierType` union expanded: added `treesitter`.

### New Features

**53 matchers across 9 categories** (was 15 matchers, 5 categories). 19 new AST checks, 7 new regex checks, 5 new filesystem checks, 4 new tree-sitter checks covering error handling, type safety, code style, and dependency verification.

**User-defined rules via `ruleprobe.config.ts`.** Add custom rules, override extracted rule severity or thresholds, exclude rules entirely. Auto-discovered in the working directory or specified with `--config`. `defineConfig()` export provides TypeScript type checking. Supports `.ts`, `.js`, `.json`, and `.ruleproberc.json` formats.

**LLM-assisted extraction (`--llm-extract`).** Sends unparseable instruction lines through an OpenAI-compatible API for a second extraction pass. Extracted rules tagged with `extractionMethod: 'llm'`, `confidence: 'medium'`, severity `warning`. Requires `OPENAI_API_KEY`. Opt-in only; default behavior unchanged.

**Rubric decomposition (`--rubric-decompose`).** Breaks subjective instructions ("write clean code") into weighted concrete checks (max function length, no magic numbers, etc.) via LLM. Tagged with `extractionMethod: 'rubric'`, `confidence: 'low'`. Requires `OPENAI_API_KEY`. Opt-in only.

**Agent invocation (`ruleprobe run`).** Invoke Claude via the Agent SDK, capture output, verify, and report in one step. Also supports `--watch` mode for any agent that writes to a directory. Requires `@anthropic-ai/claude-agent-sdk` and `ANTHROPIC_API_KEY` for SDK mode. Watch mode needs no dependencies.

**Tree-sitter multi-language support.** Python and Go get naming and function-length checks via WASM grammars. Grammar packages (`web-tree-sitter`, `tree-sitter-python`, `tree-sitter-go`) ship as regular dependencies. If loading fails on a platform, tree-sitter checks are skipped and other verifiers still run.

**Type-aware checks (`--project`).** Pass a `tsconfig.json` to enable cross-file type analysis: implicit `any` detection through aliases, unused exports, unresolved imports. Falls back to isolated-file parsing automatically if compilation fails.

### New CLI Flags

- `--llm-extract` on `parse` and `verify`
- `--rubric-decompose` on `verify`
- `--config` on `verify`, `compare`, and `run`
- `--project` on `verify` and `run`

### New Public API Exports

Functions: `defineConfig`, `loadConfig`, `applyConfig`, `extractWithLlm`, `createOpenAiProvider`, `buildAgentConfig`, `invokeAgent`, `isAgentSdkAvailable`, `hasAgentOutput`, `watchForCompletion`, `countCodeFiles`

Types: `VerifyOptions`, `RuleProbeConfig`, `CustomRule`, `RuleOverride`, `LlmProvider`, `LlmRuleCandidate`, `LlmExtractionResult`, `LlmExtractOptions`, `OpenAiProviderConfig`, `AgentInvocationConfig`, `RunOptions`, `InvocationResult`, `WatchOptions`, `WatchResult`

### Resolved Limitations

Every limitation documented in v0.1.0 has been addressed:

- "TypeScript and JavaScript only": Python and Go via tree-sitter.
- "No subjective evaluation": `--rubric-decompose` decomposes subjective rules into measurable proxies.
- "No automated agent invocation": `ruleprobe run` with Claude SDK and watch mode.
- "Conservative extraction (15 matchers)": 53 matchers, plus `--llm-extract` for the remainder.
- "Type-level checks are limited": `--project` enables TypeChecker-dependent analysis.

### Stats

| Metric | v0.1.0 | v1.0.0 |
|--------|--------|--------|
| Source files | 30 | 75 |
| Source lines | 3,328 | 8,607 |
| Test files | 13 | 27 |
| Rule matchers | 15 | 53 |
| Rule categories | 5 | 9 |
| Verifier engines | 3 | 4 |
| CLI commands | 5 | 6 |
| Public API exports | 15 | 40 |

## [0.1.0] - 2026-04-06

Initial release.

### Added

- Instruction file parser supporting CLAUDE.md, AGENTS.md, .cursorrules, copilot-instructions.md, GEMINI.md, and .windsurfrules
- Rule extractor with 15 matchers across 5 categories (naming, forbidden-pattern, structure, test-requirement, import-pattern)
- AST verifier using ts-morph for code structure checks (camelCase, PascalCase, no-any, no-console-log, named-exports, JSDoc, path aliases, deep relative imports)
- File system verifier for file naming conventions, test file existence, and directory structure
- Regex verifier for line length and file length limits
- CLI with 5 commands: parse, verify, tasks, task, compare
- Three report formats: text (terminal), JSON (CI), markdown (publishing)
- Reviewdog rdjson output format for inline PR annotations via `--format rdjson`
- GitHub Action (composite) for CI integration on every PR: verifies instruction adherence, posts PR comments, supports reviewdog
- Structured exit codes for CI: 0 (pass), 1 (violations), 2 (error)
- Programmatic API: parseInstructionFile, extractRules, verifyOutput, generateReport, formatReport
- Three task templates: rest-endpoint, utility-module, react-component
- Case study comparing two simulated agents on the rest-endpoint task
- Path traversal protection with `--allow-symlinks` flag
- All dependencies pinned to exact versions
