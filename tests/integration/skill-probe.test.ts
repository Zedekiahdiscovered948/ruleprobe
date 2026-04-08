// Integration tests for ruleprobe verify against SKILL.md fixtures.
// Runs the real CLI against a known-good output directory (all rules pass)
// and a known-bad output directory (all rules fail), asserting exact counts.

import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..', '..');
const CLI = 'npx tsx src/cli.ts';
const SKILL_MD = 'tests/fixtures/sample-skill.md';
const PASSING_DIR = 'tests/fixtures/skill-output/passing';
const FAILING_DIR = 'tests/fixtures/skill-output/failing';

function runVerify(outputDir: string): { status: number; report: Record<string, unknown> } {
  try {
    const stdout = execSync(
      `${CLI} verify ${SKILL_MD} ${outputDir} --format json`,
      { cwd: ROOT, encoding: 'utf-8', timeout: 30000, stdio: 'pipe' },
    );
    return { status: 0, report: JSON.parse(stdout) };
  } catch (err) {
    const e = err as { stdout?: string; status?: number };
    return { status: e.status ?? 1, report: JSON.parse(e.stdout ?? '{}') };
  }
}

// ── known-good: all rules must pass ──────────────────────────

describe('SKILL.md integration: known-good output', () => {
  it('exits 0 when output follows all SKILL.md rules', () => {
    const { status } = runVerify(PASSING_DIR);
    expect(status).toBe(0);
  });

  it('reports 7 rules checked with 0 failures', () => {
    const { report } = runVerify(PASSING_DIR);
    const summary = report.summary as { totalRules: number; passed: number; failed: number };
    expect(summary.totalRules).toBe(7);
    expect(summary.passed).toBe(7);
    expect(summary.failed).toBe(0);
  });

  it('passes camelCase, no-var, no-console-log, named-exports, and kebab-case rules', () => {
    const { report } = runVerify(PASSING_DIR);
    const results = report.results as Array<{ rule: { id: string }; passed: boolean }>;
    for (const result of results) {
      expect(result.passed, `expected rule ${result.rule.id} to pass`).toBe(true);
    }
  });

  it('reports 100% adherence score', () => {
    const { report } = runVerify(PASSING_DIR);
    const summary = report.summary as { adherenceScore: number };
    expect(summary.adherenceScore).toBe(100);
  });
});

// ── known-bad: all rules must fail ───────────────────────────

describe('SKILL.md integration: known-bad output', () => {
  it('exits 1 when output violates SKILL.md rules', () => {
    const { status } = runVerify(FAILING_DIR);
    expect(status).toBe(1);
  });

  it('reports 7 rules checked with 7 failures', () => {
    const { report } = runVerify(FAILING_DIR);
    const summary = report.summary as { totalRules: number; passed: number; failed: number };
    expect(summary.totalRules).toBe(7);
    expect(summary.passed).toBe(0);
    expect(summary.failed).toBe(7);
  });

  it('flags camelCase violations from snake_case variables and functions', () => {
    const { report } = runVerify(FAILING_DIR);
    const results = report.results as Array<{ rule: { id: string }; passed: boolean; evidence: unknown[] }>;
    const camelCaseResult = results.find((r) => r.rule.id.startsWith('naming-camelcase-variables'));
    expect(camelCaseResult).toBeDefined();
    expect(camelCaseResult!.passed).toBe(false);
    expect(camelCaseResult!.evidence.length).toBeGreaterThan(0);
  });

  it('flags default export violation', () => {
    const { report } = runVerify(FAILING_DIR);
    const results = report.results as Array<{ rule: { id: string }; passed: boolean }>;
    const exportsResult = results.find((r) => r.rule.id.startsWith('structure-named-exports-only'));
    expect(exportsResult).toBeDefined();
    expect(exportsResult!.passed).toBe(false);
  });

  it('flags console.log violation', () => {
    const { report } = runVerify(FAILING_DIR);
    const results = report.results as Array<{ rule: { id: string }; passed: boolean }>;
    const consoleResult = results.find((r) => r.rule.id.startsWith('forbidden-no-console-log'));
    expect(consoleResult).toBeDefined();
    expect(consoleResult!.passed).toBe(false);
  });

  it('flags var declaration violation', () => {
    const { report } = runVerify(FAILING_DIR);
    const results = report.results as Array<{ rule: { id: string }; passed: boolean }>;
    const varResult = results.find((r) => r.rule.id.startsWith('forbidden-no-var'));
    expect(varResult).toBeDefined();
    expect(varResult!.passed).toBe(false);
  });

  it('flags PascalCase filename violation for kebab-case rule', () => {
    const { report } = runVerify(FAILING_DIR);
    const results = report.results as Array<{ rule: { id: string }; passed: boolean; evidence: Array<{ found: string }> }>;
    const kebabResult = results.find((r) => r.rule.id.startsWith('naming-kebab-case-files'));
    expect(kebabResult).toBeDefined();
    expect(kebabResult!.passed).toBe(false);
    expect(kebabResult!.evidence.some((e) => e.found === 'DataProcessor.ts')).toBe(true);
  });
});
