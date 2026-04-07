/**
 * Tests for the config merger: applyConfig.
 *
 * Validates that custom rules, overrides, and exclusions are
 * applied correctly to an extracted RuleSet.
 */

import { describe, it, expect } from 'vitest';
import { applyConfig } from '../../src/config/merger.js';
import type { Rule, RuleSet } from '../../src/types.js';
import type { RuleProbeConfig } from '../../src/config/types.js';

/** Build a minimal rule for testing. */
function makeRule(id: string, category: Rule['category'] = 'naming'): Rule {
  return {
    id,
    category,
    source: 'test',
    description: `test ${id}`,
    severity: 'error',
    verifier: 'ast',
    pattern: { type: 'test', target: '*.ts', expected: false, scope: 'file' },
  };
}

/** Build a minimal RuleSet for testing. */
function makeRuleSet(rules: Rule[]): RuleSet {
  return {
    sourceFile: 'test.md',
    sourceType: 'generic-markdown',
    rules,
    unparseable: [],
  };
}

describe('applyConfig: custom rules', () => {
  it('appends custom rules to the end of extracted rules', () => {
    const ruleSet = makeRuleSet([makeRule('naming-camelcase-1')]);
    const config: RuleProbeConfig = {
      rules: [{
        id: 'custom-no-lodash',
        category: 'import-pattern',
        description: 'ban lodash',
        verifier: 'regex',
        pattern: { type: 'banned-import', target: '*.ts', expected: 'lodash', scope: 'file' },
      }],
    };

    const result = applyConfig(ruleSet, config);
    expect(result.rules).toHaveLength(2);
    expect(result.rules[1]!.id).toBe('custom-no-lodash');
    expect(result.rules[1]!.extractionMethod).toBe('custom');
    expect(result.rules[1]!.source).toBe('ruleprobe.config');
  });

  it('defaults custom rule severity to error', () => {
    const ruleSet = makeRuleSet([]);
    const config: RuleProbeConfig = {
      rules: [{
        id: 'custom-test',
        category: 'naming',
        description: 'test',
        verifier: 'ast',
        pattern: { type: 'test', target: '*.ts', expected: false, scope: 'file' },
      }],
    };

    const result = applyConfig(ruleSet, config);
    expect(result.rules[0]!.severity).toBe('error');
  });

  it('respects custom severity when provided', () => {
    const ruleSet = makeRuleSet([]);
    const config: RuleProbeConfig = {
      rules: [{
        id: 'custom-warn',
        category: 'naming',
        description: 'test',
        severity: 'warning',
        verifier: 'ast',
        pattern: { type: 'test', target: '*.ts', expected: false, scope: 'file' },
      }],
    };

    const result = applyConfig(ruleSet, config);
    expect(result.rules[0]!.severity).toBe('warning');
  });
});

describe('applyConfig: overrides', () => {
  it('overrides severity by rule ID prefix', () => {
    const ruleSet = makeRuleSet([makeRule('naming-camelcase-1')]);
    const config: RuleProbeConfig = {
      overrides: [{ ruleId: 'naming-camelcase', severity: 'warning' }],
    };

    const result = applyConfig(ruleSet, config);
    expect(result.rules[0]!.severity).toBe('warning');
  });

  it('overrides expected value', () => {
    const ruleSet = makeRuleSet([makeRule('naming-camelcase-1')]);
    const config: RuleProbeConfig = {
      overrides: [{ ruleId: 'naming-camelcase', expected: 'custom-value' }],
    };

    const result = applyConfig(ruleSet, config);
    expect(result.rules[0]!.pattern.expected).toBe('custom-value');
  });

  it('disables a rule via override', () => {
    const ruleSet = makeRuleSet([
      makeRule('naming-camelcase-1'),
      makeRule('forbidden-no-any-2', 'forbidden-pattern'),
    ]);
    const config: RuleProbeConfig = {
      overrides: [{ ruleId: 'naming-camelcase', disabled: true }],
    };

    const result = applyConfig(ruleSet, config);
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]!.id).toBe('forbidden-no-any-2');
  });

  it('matches by full rule ID', () => {
    const ruleSet = makeRuleSet([makeRule('naming-camelcase-1')]);
    const config: RuleProbeConfig = {
      overrides: [{ ruleId: 'naming-camelcase-1', severity: 'warning' }],
    };

    const result = applyConfig(ruleSet, config);
    expect(result.rules[0]!.severity).toBe('warning');
  });

  it('leaves unmatched rules unchanged', () => {
    const ruleSet = makeRuleSet([makeRule('naming-camelcase-1')]);
    const config: RuleProbeConfig = {
      overrides: [{ ruleId: 'nonexistent', severity: 'warning' }],
    };

    const result = applyConfig(ruleSet, config);
    expect(result.rules[0]!.severity).toBe('error');
  });
});

describe('applyConfig: exclusions', () => {
  it('excludes rules by ID prefix', () => {
    const ruleSet = makeRuleSet([
      makeRule('naming-camelcase-1'),
      makeRule('forbidden-no-any-2', 'forbidden-pattern'),
    ]);
    const config: RuleProbeConfig = {
      exclude: ['naming-camelcase'],
    };

    const result = applyConfig(ruleSet, config);
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]!.id).toBe('forbidden-no-any-2');
  });

  it('excludes rules by full ID', () => {
    const ruleSet = makeRuleSet([
      makeRule('naming-camelcase-1'),
      makeRule('forbidden-no-any-2', 'forbidden-pattern'),
    ]);
    const config: RuleProbeConfig = {
      exclude: ['naming-camelcase-1'],
    };

    const result = applyConfig(ruleSet, config);
    expect(result.rules).toHaveLength(1);
  });

  it('returns empty rules when all are excluded', () => {
    const ruleSet = makeRuleSet([makeRule('naming-camelcase-1')]);
    const config: RuleProbeConfig = {
      exclude: ['naming-camelcase'],
    };

    const result = applyConfig(ruleSet, config);
    expect(result.rules).toHaveLength(0);
  });
});

describe('applyConfig: combined operations', () => {
  it('applies overrides, exclusions, then adds custom rules in order', () => {
    const ruleSet = makeRuleSet([
      makeRule('naming-camelcase-1'),
      makeRule('forbidden-no-any-2', 'forbidden-pattern'),
      makeRule('structure-named-exports-3', 'structure'),
    ]);
    const config: RuleProbeConfig = {
      overrides: [{ ruleId: 'forbidden-no-any', severity: 'warning' }],
      exclude: ['naming-camelcase'],
      rules: [{
        id: 'custom-check',
        category: 'code-style',
        description: 'custom check',
        verifier: 'ast',
        pattern: { type: 'custom', target: '*.ts', expected: false, scope: 'file' },
      }],
    };

    const result = applyConfig(ruleSet, config);
    expect(result.rules).toHaveLength(3);
    expect(result.rules[0]!.id).toBe('forbidden-no-any-2');
    expect(result.rules[0]!.severity).toBe('warning');
    expect(result.rules[1]!.id).toBe('structure-named-exports-3');
    expect(result.rules[2]!.id).toBe('custom-check');
  });

  it('does not mutate the original RuleSet', () => {
    const ruleSet = makeRuleSet([makeRule('naming-camelcase-1')]);
    const config: RuleProbeConfig = {
      exclude: ['naming-camelcase'],
      rules: [{
        id: 'custom-check',
        category: 'naming',
        description: 'test',
        verifier: 'ast',
        pattern: { type: 'test', target: '*.ts', expected: false, scope: 'file' },
      }],
    };

    applyConfig(ruleSet, config);
    expect(ruleSet.rules).toHaveLength(1);
    expect(ruleSet.rules[0]!.id).toBe('naming-camelcase-1');
  });

  it('preserves original ruleSet metadata', () => {
    const ruleSet = makeRuleSet([makeRule('naming-camelcase-1')]);
    ruleSet.sourceFile = 'CLAUDE.md';
    ruleSet.sourceType = 'claude.md';
    ruleSet.unparseable = ['some unparseable line'];

    const config: RuleProbeConfig = {
      rules: [{
        id: 'custom-check',
        category: 'naming',
        description: 'test',
        verifier: 'ast',
        pattern: { type: 'test', target: '*.ts', expected: false, scope: 'file' },
      }],
    };

    const result = applyConfig(ruleSet, config);
    expect(result.sourceFile).toBe('CLAUDE.md');
    expect(result.sourceType).toBe('claude.md');
    expect(result.unparseable).toEqual(['some unparseable line']);
  });

  it('handles empty config gracefully', () => {
    const ruleSet = makeRuleSet([makeRule('naming-camelcase-1')]);
    const config: RuleProbeConfig = {};

    const result = applyConfig(ruleSet, config);
    expect(result.rules).toHaveLength(1);
  });
});
