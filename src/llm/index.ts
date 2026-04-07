/**
 * LLM extraction module entry point.
 *
 * Re-exports types, providers, extraction pipeline, and rubric decomposition.
 */

export type {
  LlmProvider,
  LlmRuleCandidate,
  LlmExtractionResult,
  LlmExtractOptions,
} from './types.js';
export { createOpenAiProvider } from './openai-provider.js';
export type { OpenAiProviderConfig } from './openai-provider.js';
export { buildExtractionPrompt, parseExtractionResponse } from './extract.js';
export { extractWithLlm } from './pipeline.js';
export type {
  RubricCheck,
  DecomposedRubric,
  DecompositionResult,
  RubricDecomposer,
} from './rubric-types.js';
export { buildRubricPrompt, parseRubricResponse } from './rubric-decompose.js';
export { decomposeRubrics } from './rubric-pipeline.js';
export type { RubricDecomposeOptions } from './rubric-pipeline.js';
