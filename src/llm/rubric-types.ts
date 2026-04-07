/**
 * Rubric decomposition for subjective instructions.
 *
 * Takes subjective lines like "write clean code" and decomposes them
 * into weighted sets of concrete, measurable proxy checks. Each
 * decomposed rubric maps to existing pattern types so the verifier
 * can produce a partial adherence score.
 */

import type { RuleCategory, VerifierType } from '../types.js';

/**
 * A single check within a decomposed rubric.
 * Each check maps to an existing verifier pattern type.
 */
export interface RubricCheck {
  /** Short identifier for this sub-check. */
  id: string;
  /** Human-readable description of what this checks. */
  description: string;
  /** Weight (0-1) within the rubric. All weights in a rubric should sum to 1. */
  weight: number;
  /** Which verifier handles this check. */
  verifier: VerifierType;
  /** Pattern type (must match an existing check). */
  patternType: string;
  /** Target files or scope. */
  target: string;
  /** Expected value. */
  expected: string | boolean;
  /** Scope: file or project level. */
  scope: 'file' | 'project';
}

/**
 * A decomposed rubric for a subjective instruction.
 * Contains the original line and its proxy checks.
 */
export interface DecomposedRubric {
  /** The original subjective instruction. */
  sourceLine: string;
  /** Category for the rubric. */
  category: RuleCategory;
  /** Human-readable summary of the rubric. */
  summary: string;
  /** Concrete checks that collectively approximate the instruction. */
  checks: RubricCheck[];
}

/**
 * Result from the decomposition pipeline.
 */
export interface DecompositionResult {
  /** Successfully decomposed rubrics. */
  rubrics: DecomposedRubric[];
  /** Lines that could not be decomposed even by the LLM. */
  remaining: string[];
}

/**
 * Provider interface for rubric decomposition.
 * Any LLM backend can implement this to provide decomposition.
 */
export interface RubricDecomposer {
  /** Human-readable provider name. */
  name: string;
  /**
   * Decompose subjective instruction lines into rubrics.
   *
   * @param lines - Subjective instruction lines
   * @param knownPatternTypes - Pattern types the verifiers support
   * @returns Decomposed rubrics and remaining undecomposable lines
   */
  decompose(
    lines: string[],
    knownPatternTypes: string[],
  ): Promise<DecompositionResult>;
}
