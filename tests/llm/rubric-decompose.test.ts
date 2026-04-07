/**
 * Tests for rubric decomposition prompt building and response parsing.
 *
 * Validates the rubric decompose module: prompt construction,
 * response parsing, weight normalization, and validation logic.
 */

import { describe, it, expect } from 'vitest';
import { buildRubricPrompt, parseRubricResponse } from '../../src/llm/rubric-decompose.js';
import { decomposeRubrics } from '../../src/llm/rubric-pipeline.js';
import type { RubricDecomposer, DecompositionResult } from '../../src/llm/rubric-types.js';
import type { RuleSet } from '../../src/types.js';

const KNOWN_TYPES = [
  'camelCase', 'no-any', 'no-console-log', 'named-exports', 'jsdoc-public',
  'max-function-length', 'no-nested-ternary', 'no-magic-numbers',
  'kebab-case', 'max-file-length',
];

describe('buildRubricPrompt', () => {
  it('includes all pattern types in the system prompt', () => {
    const prompt = buildRubricPrompt(['write clean code'], KNOWN_TYPES);
    for (const t of KNOWN_TYPES) {
      expect(prompt.system).toContain(t);
    }
  });

  it('includes the subjective lines in the user prompt', () => {
    const lines = ['write clean code', 'follow best practices'];
    const prompt = buildRubricPrompt(lines, KNOWN_TYPES);
    expect(prompt.user).toContain('write clean code');
    expect(prompt.user).toContain('follow best practices');
  });

  it('numbers the lines in the user prompt', () => {
    const prompt = buildRubricPrompt(['line A', 'line B'], KNOWN_TYPES);
    expect(prompt.user).toContain('1. line A');
    expect(prompt.user).toContain('2. line B');
  });
});

describe('parseRubricResponse', () => {
  const validResponse = JSON.stringify({
    rubrics: [
      {
        sourceLine: 'write clean code',
        category: 'code-style',
        summary: 'Code cleanliness proxy checks',
        checks: [
          {
            id: 'short-functions',
            description: 'Functions under 50 lines',
            weight: 0.4,
            verifier: 'ast',
            patternType: 'max-function-length',
            target: '*.ts',
            expected: '50',
            scope: 'file',
          },
          {
            id: 'no-magic-nums',
            description: 'No magic numbers',
            weight: 0.3,
            verifier: 'ast',
            patternType: 'no-magic-numbers',
            target: '*.ts',
            expected: true,
            scope: 'file',
          },
          {
            id: 'no-nested-ternaries',
            description: 'No nested ternaries',
            weight: 0.3,
            verifier: 'ast',
            patternType: 'no-nested-ternary',
            target: '*.ts',
            expected: true,
            scope: 'file',
          },
        ],
      },
    ],
  });

  it('parses a valid rubric response', () => {
    const result = parseRubricResponse(
      validResponse,
      ['write clean code'],
      KNOWN_TYPES,
    );
    expect(result.rubrics).toHaveLength(1);
    expect(result.rubrics[0]!.sourceLine).toBe('write clean code');
    expect(result.rubrics[0]!.checks).toHaveLength(3);
    expect(result.remaining).toHaveLength(0);
  });

  it('normalizes weights to sum to 1.0', () => {
    const unevenResponse = JSON.stringify({
      rubrics: [
        {
          sourceLine: 'write clean code',
          category: 'code-style',
          summary: 'Cleanliness checks',
          checks: [
            {
              id: 'a', description: 'A', weight: 0.5,
              verifier: 'ast', patternType: 'max-function-length',
              target: '*.ts', expected: '50', scope: 'file',
            },
            {
              id: 'b', description: 'B', weight: 0.8,
              verifier: 'ast', patternType: 'no-magic-numbers',
              target: '*.ts', expected: true, scope: 'file',
            },
          ],
        },
      ],
    });

    const result = parseRubricResponse(unevenResponse, ['write clean code'], KNOWN_TYPES);
    expect(result.rubrics).toHaveLength(1);
    const totalWeight = result.rubrics[0]!.checks.reduce((sum, c) => sum + c.weight, 0);
    expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.01);
  });

  it('rejects rubrics with fewer than 2 valid checks', () => {
    const singleCheck = JSON.stringify({
      rubrics: [
        {
          sourceLine: 'be good',
          category: 'code-style',
          summary: 'Goodness',
          checks: [
            {
              id: 'a', description: 'A', weight: 1.0,
              verifier: 'ast', patternType: 'max-function-length',
              target: '*.ts', expected: '50', scope: 'file',
            },
          ],
        },
      ],
    });

    const result = parseRubricResponse(singleCheck, ['be good'], KNOWN_TYPES);
    expect(result.rubrics).toHaveLength(0);
    expect(result.remaining).toContain('be good');
  });

  it('rejects checks with unknown pattern types', () => {
    const unknownType = JSON.stringify({
      rubrics: [
        {
          sourceLine: 'be clean',
          category: 'code-style',
          summary: 'Clean code',
          checks: [
            {
              id: 'a', description: 'A', weight: 0.5,
              verifier: 'ast', patternType: 'unknown-type',
              target: '*.ts', expected: true, scope: 'file',
            },
            {
              id: 'b', description: 'B', weight: 0.5,
              verifier: 'ast', patternType: 'also-unknown',
              target: '*.ts', expected: true, scope: 'file',
            },
          ],
        },
      ],
    });

    const result = parseRubricResponse(unknownType, ['be clean'], KNOWN_TYPES);
    expect(result.rubrics).toHaveLength(0);
    expect(result.remaining).toContain('be clean');
  });

  it('handles invalid JSON gracefully', () => {
    const result = parseRubricResponse('not json', ['test'], KNOWN_TYPES);
    expect(result.rubrics).toHaveLength(0);
    expect(result.remaining).toEqual(['test']);
  });

  it('handles empty rubrics array', () => {
    const result = parseRubricResponse('{"rubrics": []}', ['test'], KNOWN_TYPES);
    expect(result.rubrics).toHaveLength(0);
    expect(result.remaining).toEqual(['test']);
  });
});

describe('decomposeRubrics pipeline', () => {
  function makeRuleSet(unparseable: string[]): RuleSet {
    return {
      sourceFile: 'test.md',
      sourceType: 'unknown',
      rules: [],
      unparseable,
    };
  }

  function makeMockDecomposer(result: DecompositionResult): RubricDecomposer {
    return {
      name: 'mock-decomposer',
      decompose: async () => result,
    };
  }

  it('converts rubrics to rules with extractionMethod rubric', async () => {
    const decomposer = makeMockDecomposer({
      rubrics: [
        {
          sourceLine: 'write clean code',
          category: 'code-style',
          summary: 'Clean code checks',
          checks: [
            {
              id: 'func-length', description: 'Short functions', weight: 0.5,
              verifier: 'ast', patternType: 'max-function-length',
              target: '*.ts', expected: '50', scope: 'file',
            },
            {
              id: 'no-magic', description: 'No magic numbers', weight: 0.5,
              verifier: 'ast', patternType: 'no-magic-numbers',
              target: '*.ts', expected: true, scope: 'file',
            },
          ],
        },
      ],
      remaining: [],
    });

    const ruleSet = makeRuleSet(['write clean code']);
    const result = await decomposeRubrics(ruleSet, { decomposer });

    expect(result.rules).toHaveLength(2);
    expect(result.rules[0]!.id).toBe('rubric-func-length');
    expect(result.rules[0]!.extractionMethod).toBe('rubric');
    expect(result.rules[0]!.rubricWeight).toBe(0.5);
    expect(result.rules[0]!.confidence).toBe('low');
    expect(result.rules[1]!.id).toBe('rubric-no-magic');
  });

  it('preserves existing rules', async () => {
    const decomposer = makeMockDecomposer({ rubrics: [], remaining: ['test'] });
    const ruleSet: RuleSet = {
      sourceFile: 'test.md',
      sourceType: 'unknown',
      rules: [{
        id: 'existing-1', category: 'naming', source: 'test',
        description: 'existing', severity: 'error', verifier: 'ast',
        pattern: { type: 'camelCase', target: 'variables', expected: true, scope: 'file' },
      }],
      unparseable: ['subjective line'],
    };

    const result = await decomposeRubrics(ruleSet, { decomposer });
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]!.id).toBe('existing-1');
  });

  it('returns unchanged ruleset when no unparseable lines', async () => {
    const decomposer = makeMockDecomposer({ rubrics: [], remaining: [] });
    const ruleSet = makeRuleSet([]);
    const result = await decomposeRubrics(ruleSet, { decomposer });
    expect(result).toEqual(ruleSet);
  });

  it('deduplicates rubric rule IDs against existing rules', async () => {
    const decomposer = makeMockDecomposer({
      rubrics: [{
        sourceLine: 'test',
        category: 'code-style',
        summary: 'Test',
        checks: [
          {
            id: 'func-length', description: 'A', weight: 0.5,
            verifier: 'ast', patternType: 'max-function-length',
            target: '*.ts', expected: '50', scope: 'file',
          },
          {
            id: 'no-magic', description: 'B', weight: 0.5,
            verifier: 'ast', patternType: 'no-magic-numbers',
            target: '*.ts', expected: true, scope: 'file',
          },
        ],
      }],
      remaining: [],
    });

    const ruleSet: RuleSet = {
      sourceFile: 'test.md',
      sourceType: 'unknown',
      rules: [{
        id: 'rubric-func-length', category: 'code-style', source: 'test',
        description: 'existing', severity: 'warning', verifier: 'ast',
        pattern: { type: 'max-function-length', target: '*.ts', expected: '50', scope: 'file' },
      }],
      unparseable: ['test'],
    };

    const result = await decomposeRubrics(ruleSet, { decomposer });
    // Only the second check should be added (first is duplicate)
    expect(result.rules).toHaveLength(2);
    expect(result.rules[1]!.id).toBe('rubric-no-magic');
  });
});
