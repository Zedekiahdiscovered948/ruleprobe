/**
 * AST check for wildcard re-exports.
 *
 * Detects `export * from '...'` statements, which obscure the
 * public surface of a module and make it hard to track where
 * names originate.
 */

import type { SourceFile } from 'ts-morph';
import type { Evidence } from '../types.js';
import { makeEvidence } from './helpers.js';

/**
 * Detect wildcard export declarations in source code.
 *
 * Flags `export * from './some-module'` statements. Named
 * re-exports (`export { foo } from './module'`) are allowed.
 *
 * @param sourceFile - ts-morph SourceFile to analyze
 * @param filePath - Relative path for evidence output
 * @returns Evidence array for violations found
 */
export function checkNoWildcardExports(sourceFile: SourceFile, filePath: string): Evidence[] {
  const evidence: Evidence[] = [];

  for (const exportDecl of sourceFile.getExportDeclarations()) {
    // Wildcard export: has a module specifier but no named exports
    if (exportDecl.getModuleSpecifier() && exportDecl.getNamedExports().length === 0) {
      // Check it's not `export {}` (empty named export)
      if (exportDecl.isNamespaceExport() || !exportDecl.hasNamedExports()) {
        const specifier = exportDecl.getModuleSpecifierValue() ?? 'unknown';
        evidence.push(
          makeEvidence(
            filePath,
            exportDecl,
            `export * from '${specifier}'`,
            'use named re-exports instead of wildcard exports',
          ),
        );
      }
    }
  }

  return evidence;
}
