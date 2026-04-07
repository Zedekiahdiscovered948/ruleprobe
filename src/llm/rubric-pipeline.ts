/**
 * Rubric decomposition pipeline.
 *
 * Takes a RuleSet with unparseable lines, decomposes subjective
 * instructions into rubrics, and converts rubric checks into
 * verifiable Rule objects. Each decomposed rubric produces multiple
 * rules tagged with extractionMethod 'rubric'.
 */

import type { Rule, RuleSet } from '../types.js';
import type { RubricDecomposer, DecomposedRubric, RubricCheck } from './rubric-types.js';

/**
 * All known pattern types that rubric checks can reference.
 * Kept in sync with the verifier switch statements.
 */
const KNOWN_PATTERN_TYPES: string[] = [
  // AST checks
  'camelCase', 'PascalCase', 'no-any', 'no-console-log', 'named-exports',
  'jsdoc-public', 'no-path-aliases', 'no-deep-relative-imports',
  'no-empty-catch', 'no-enum', 'no-type-assertions', 'no-non-null-assertions',
  'throw-error-only', 'no-console-extended', 'no-nested-ternary',
  'no-magic-numbers', 'no-else-after-return', 'max-function-length',
  'max-params', 'no-namespace-imports', 'no-barrel-files', 'no-settimeout-in-tests',
  'no-var', 'prefer-const', 'no-wildcard-exports',
  // Regex checks
  'line-length', 'no-ts-directives', 'no-test-only', 'no-test-skip',
  'quote-style', 'banned-import', 'no-todo-comments', 'consistent-semicolons',
  // Filesystem checks
  'kebab-case', 'test-files-exist', 'max-file-length', 'test-file-naming',
  'strict-mode', 'file-exists', 'formatter-config', 'pinned-dependencies',
  // Type-aware checks
  'no-implicit-any', 'no-unused-exports', 'no-unresolved-imports',
  // Tree-sitter checks
  'python-snake-case', 'python-class-naming', 'go-naming', 'function-length',
];

/** Options for rubric decomposition. */
export interface RubricDecomposeOptions {
  /** The decomposer to use. */
  decomposer: RubricDecomposer;
  /** Max unparseable lines to process. Defaults to 20. */
  batchSize?: number;
}

/**
 * Run rubric decomposition on a RuleSet's unparseable lines.
 *
 * Sends unparseable lines to the decomposer, converts valid rubrics
 * into Rule objects with extractionMethod 'rubric', and returns a
 * new RuleSet with rubric-derived rules appended.
 *
 * Does not mutate the input RuleSet.
 *
 * @param ruleSet - The RuleSet from static/LLM extraction
 * @param options - Decomposer and options
 * @returns New RuleSet with rubric-derived rules merged in
 */
export async function decomposeRubrics(
  ruleSet: RuleSet,
  options: RubricDecomposeOptions,
): Promise<RuleSet> {
  const { decomposer, batchSize = 20 } = options;

  if (ruleSet.unparseable.length === 0) {
    return ruleSet;
  }

  const lines = ruleSet.unparseable.slice(0, batchSize);
  const result = await decomposer.decompose(lines, KNOWN_PATTERN_TYPES);

  const existingIds = new Set(ruleSet.rules.map((r) => r.id));
  const newRules: Rule[] = [];

  for (const rubric of result.rubrics) {
    const rules = rubricToRules(rubric, existingIds);
    newRules.push(...rules);
  }

  const remainingUnparseable = [
    ...result.remaining,
    ...ruleSet.unparseable.slice(batchSize),
  ];

  return {
    ...ruleSet,
    rules: [...ruleSet.rules, ...newRules],
    unparseable: remainingUnparseable,
  };
}

/**
 * Convert a decomposed rubric into Rule objects.
 *
 * Each check in the rubric becomes a separate Rule with:
 * - extractionMethod set to 'rubric'
 * - confidence set to 'low' (proxy checks are approximations)
 * - severity set to 'warning' (subjective rules are advisory)
 * - rubricWeight stored in the rule metadata
 */
function rubricToRules(rubric: DecomposedRubric, existingIds: Set<string>): Rule[] {
  const rules: Rule[] = [];

  for (const check of rubric.checks) {
    const ruleId = `rubric-${check.id}`;
    if (existingIds.has(ruleId)) {
      continue;
    }
    existingIds.add(ruleId);

    rules.push(checkToRule(check, rubric));
  }

  return rules;
}

/**
 * Convert a single rubric check to a Rule.
 */
function checkToRule(check: RubricCheck, rubric: DecomposedRubric): Rule {
  return {
    id: `rubric-${check.id}`,
    category: rubric.category,
    source: rubric.sourceLine,
    description: `[rubric: ${rubric.summary}] ${check.description}`,
    severity: 'warning',
    verifier: check.verifier,
    pattern: {
      type: check.patternType,
      target: check.target,
      expected: check.expected,
      scope: check.scope,
    },
    confidence: 'low',
    extractionMethod: 'rubric',
    rubricWeight: check.weight,
  };
}
