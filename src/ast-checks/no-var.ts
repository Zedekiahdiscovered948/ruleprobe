/**
 * AST check for var declarations.
 *
 * Detects usage of `var` keyword, which should be replaced with
 * `const` or `let` in modern TypeScript/JavaScript.
 */

import { VariableDeclarationKind, SyntaxKind, type SourceFile } from 'ts-morph';
import type { Evidence } from '../types.js';
import { makeEvidence } from './helpers.js';

/**
 * Detect var declarations in source code.
 *
 * Flags any `var` keyword usage, including inside functions and
 * for-loops. Modern code should use `const` or `let` for block
 * scoping and safer variable binding.
 *
 * @param sourceFile - ts-morph SourceFile to analyze
 * @param filePath - Relative path for evidence output
 * @returns Evidence array for violations found
 */
export function checkNoVar(sourceFile: SourceFile, filePath: string): Evidence[] {
  const evidence: Evidence[] = [];

  // Check all VariableStatements in any scope (not just top-level)
  for (const statement of sourceFile.getDescendantsOfKind(SyntaxKind.VariableStatement)) {
    if (statement.getDeclarationKind() === VariableDeclarationKind.Var) {
      const declarations = statement.getDeclarations();
      const names = declarations.map(d => d.getName()).join(', ');
      evidence.push(
        makeEvidence(
          filePath,
          statement,
          `var ${names}`,
          'use const or let instead of var',
        ),
      );
    }
  }

  // Check for-loop initializers: for (var i = ...)
  for (const forStmt of sourceFile.getDescendantsOfKind(SyntaxKind.ForStatement)) {
    const init = forStmt.getInitializer();
    if (init && init.getKind() === SyntaxKind.VariableDeclarationList) {
      const text = init.getText();
      if (text.startsWith('var ')) {
        evidence.push(
          makeEvidence(
            filePath,
            forStmt,
            text,
            'use let instead of var in for-loop initializer',
          ),
        );
      }
    }
  }

  return evidence;
}
