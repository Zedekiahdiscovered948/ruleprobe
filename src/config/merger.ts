/**
 * Config merger: applies custom rules, overrides, and exclusions
 * to an extracted RuleSet.
 *
 * The merge order is:
 * 1. Start with extracted rules
 * 2. Apply overrides (severity, expected value, disabled flag)
 * 3. Remove excluded rules
 * 4. Append custom rules
 */

import type { Rule, RuleSet } from '../types.js';
import type { RuleProbeConfig } from './types.js';

/**
 * Apply a config to a RuleSet, producing a new RuleSet with
 * custom rules merged, overrides applied, and exclusions removed.
 *
 * Does not mutate the input RuleSet or config.
 *
 * @param ruleSet - The extracted RuleSet from the instruction file
 * @param config - User-defined configuration
 * @returns A new RuleSet with config applied
 */
export function applyConfig(ruleSet: RuleSet, config: RuleProbeConfig): RuleSet {
  let rules = [...ruleSet.rules];

  if (config.overrides) {
    rules = applyOverrides(rules, config.overrides);
  }

  if (config.exclude) {
    rules = applyExclusions(rules, config.exclude);
  }

  if (config.rules) {
    const customRules = config.rules.map((custom): Rule => ({
      id: custom.id,
      category: custom.category,
      source: 'ruleprobe.config',
      description: custom.description,
      severity: custom.severity ?? 'error',
      verifier: custom.verifier,
      pattern: custom.pattern,
      confidence: 'high',
      extractionMethod: 'custom',
    }));
    rules = [...rules, ...customRules];
  }

  return {
    ...ruleSet,
    rules,
  };
}

/**
 * Apply overrides to a list of rules. Matches rules by ID prefix.
 *
 * @param rules - The rules to modify
 * @param overrides - Override definitions from config
 * @returns New array with overrides applied
 */
function applyOverrides(
  rules: Rule[],
  overrides: RuleProbeConfig['overrides'] & object,
): Rule[] {
  return rules
    .map((rule) => {
      const prefix = rule.id.replace(/-\d+$/, '');
      const override = overrides.find(
        (o) => o.ruleId === prefix || o.ruleId === rule.id,
      );

      if (!override) {
        return rule;
      }

      if (override.disabled) {
        return null;
      }

      const updated = { ...rule };
      if (override.severity) {
        updated.severity = override.severity;
      }
      if (override.expected !== undefined) {
        updated.pattern = { ...updated.pattern, expected: override.expected };
      }
      return updated;
    })
    .filter((r): r is Rule => r !== null);
}

/**
 * Remove rules whose ID (with or without suffix) matches any exclusion.
 *
 * @param rules - The rules to filter
 * @param exclude - Array of rule ID prefixes to exclude
 * @returns Filtered array
 */
function applyExclusions(rules: Rule[], exclude: string[]): Rule[] {
  return rules.filter((rule) => {
    const prefix = rule.id.replace(/-\d+$/, '');
    return !exclude.includes(prefix) && !exclude.includes(rule.id);
  });
}
