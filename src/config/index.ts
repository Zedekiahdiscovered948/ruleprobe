/**
 * Configuration module entry point.
 *
 * Re-exports types, loader, and merger for config handling.
 */

export { loadConfig, findConfigFile, validateConfig } from './loader.js';
export { applyConfig } from './merger.js';
export type { RuleProbeConfig, CustomRule, RuleOverride } from './types.js';

/**
 * Helper for TypeScript config files. Provides type checking
 * without runtime overhead.
 *
 * Usage in ruleprobe.config.ts:
 * ```
 * import { defineConfig } from 'ruleprobe';
 * export default defineConfig({ rules: [...] });
 * ```
 */
export function defineConfig(config: import('./types.js').RuleProbeConfig): import('./types.js').RuleProbeConfig {
  return config;
}
