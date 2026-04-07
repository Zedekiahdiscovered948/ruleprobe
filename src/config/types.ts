/**
 * Types for user-defined rule configuration.
 *
 * Users create a ruleprobe.config.ts (or .js, .json) to add custom rules,
 * override extracted rule properties, or exclude specific rules by ID.
 */

import type { RuleCategory, VerifierType, VerificationPattern } from '../types.js';

/**
 * A user-defined rule. Mirrors the core Rule type but omits
 * auto-generated fields (id suffix, source, extractionMethod).
 */
export interface CustomRule {
  /** Rule identifier. Must be unique across all custom rules. */
  id: string;
  /** Which category this rule belongs to. */
  category: RuleCategory;
  /** Human-readable description of what the rule checks. */
  description: string;
  /** Whether a violation is an error or a warning. Defaults to 'error'. */
  severity?: 'error' | 'warning';
  /** Which verification engine handles this rule. */
  verifier: VerifierType;
  /** The specific check to run. */
  pattern: VerificationPattern;
}

/**
 * Override properties for an extracted rule, matched by ID prefix.
 * Any field set here replaces the corresponding field on the matched rule.
 */
export interface RuleOverride {
  /** Rule ID prefix to match (e.g. "naming-camelcase-variables"). */
  ruleId: string;
  /** Override the severity. */
  severity?: 'error' | 'warning';
  /** Disable the rule entirely (equivalent to adding it to exclude). */
  disabled?: boolean;
  /** Override the expected value in the verification pattern. */
  expected?: string | boolean;
}

/**
 * Top-level configuration object for ruleprobe.config.ts.
 */
export interface RuleProbeConfig {
  /** Additional user-defined rules to verify alongside extracted rules. */
  rules?: CustomRule[];
  /** Override properties on extracted rules (matched by ID prefix). */
  overrides?: RuleOverride[];
  /** Rule ID prefixes to exclude from verification. */
  exclude?: string[];
}
