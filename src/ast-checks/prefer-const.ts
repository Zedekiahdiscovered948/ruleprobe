/**
 * AST check for let declarations that could be const.
 *
 * Detects `let` declarations where the variable is never reassigned,
 * indicating it should be `const` instead.
 */

import {
  VariableDeclarationKind,
  SyntaxKind,
  type SourceFile,
  type VariableDeclaration,
  type Node,
} from 'ts-morph';
import type { Evidence } from '../types.js';
import { makeEvidence } from './helpers.js';

/**
 * Check whether a variable declaration is ever reassigned.
 *
 * Walks through the containing scope to find assignment expressions
 * or update expressions targeting the variable name.
 */
function isReassigned(decl: VariableDeclaration): boolean {
  const name = decl.getName();
  const scope = decl.getFirstAncestorByKind(SyntaxKind.Block)
    ?? decl.getSourceFile();

  for (const id of scope.getDescendantsOfKind(SyntaxKind.Identifier)) {
    if (id.getText() !== name) {
      continue;
    }

    // Skip the declaration itself
    if (id === decl.getNameNode()) {
      continue;
    }

    const parent = id.getParent();
    if (!parent) {
      continue;
    }

    // Check for assignment: x = ..., x += ..., etc.
    if (parent.getKind() === SyntaxKind.BinaryExpression) {
      const children = parent.getChildren();
      const operator = children[1];
      if (operator && isAssignmentOperator(operator) && children[0] === id) {
        return true;
      }
    }

    // Check for ++x, x++, --x, x--
    if (
      parent.getKind() === SyntaxKind.PrefixUnaryExpression ||
      parent.getKind() === SyntaxKind.PostfixUnaryExpression
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Determine if a node is an assignment operator (=, +=, -=, etc.).
 */
function isAssignmentOperator(node: Node): boolean {
  const kind = node.getKind();
  return (
    kind === SyntaxKind.EqualsToken ||
    kind === SyntaxKind.PlusEqualsToken ||
    kind === SyntaxKind.MinusEqualsToken ||
    kind === SyntaxKind.AsteriskEqualsToken ||
    kind === SyntaxKind.SlashEqualsToken ||
    kind === SyntaxKind.PercentEqualsToken ||
    kind === SyntaxKind.AmpersandEqualsToken ||
    kind === SyntaxKind.BarEqualsToken ||
    kind === SyntaxKind.CaretEqualsToken
  );
}

/**
 * Detect let declarations that are never reassigned.
 *
 * These should use `const` instead. Only flags `let` bindings
 * with an initializer that have no subsequent reassignment.
 * Searches all scopes, not just the top-level.
 *
 * @param sourceFile - ts-morph SourceFile to analyze
 * @param filePath - Relative path for evidence output
 * @returns Evidence array for violations found
 */
export function checkPreferConst(sourceFile: SourceFile, filePath: string): Evidence[] {
  const evidence: Evidence[] = [];

  for (const statement of sourceFile.getDescendantsOfKind(SyntaxKind.VariableStatement)) {
    if (statement.getDeclarationKind() !== VariableDeclarationKind.Let) {
      continue;
    }

    for (const decl of statement.getDeclarations()) {
      if (!decl.getInitializer()) {
        continue;
      }

      if (!isReassigned(decl)) {
        evidence.push(
          makeEvidence(
            filePath,
            statement,
            `let ${decl.getName()} (never reassigned)`,
            'use const for variables that are not reassigned',
          ),
        );
      }
    }
  }

  return evidence;
}
