/**
 * AST check: concise conditionals.
 *
 * Flags if/else/for/while statements where the body is a block
 * containing exactly one statement. The braces are unnecessary
 * in that case. Only applies when extracted from an instruction
 * file that explicitly asks for concise conditional syntax.
 */

import { SyntaxKind } from 'ts-morph';
import type { SourceFile } from 'ts-morph';
import type { Evidence } from '../types.js';

/**
 * Check for unnecessary braces around single-statement bodies
 * in if, else, for, while, and do-while statements.
 *
 * A block is "unnecessary" when it wraps exactly one statement
 * that is not itself a block or a variable declaration (variable
 * declarations require braces for scoping).
 *
 * @param sourceFile - The ts-morph SourceFile to analyze
 * @param filePath - Relative file path for evidence reporting
 * @returns Evidence array (empty if no violations found)
 */
export function checkConciseConditionals(
  sourceFile: SourceFile,
  filePath: string,
): Evidence[] {
  const evidence: Evidence[] = [];

  const ifStatements = sourceFile.getDescendantsOfKind(SyntaxKind.IfStatement);
  for (const ifStmt of ifStatements) {
    checkBlock(ifStmt.getThenStatement(), filePath, 'if', evidence);

    const elseStmt = ifStmt.getElseStatement();
    if (elseStmt && elseStmt.getKind() !== SyntaxKind.IfStatement) {
      checkBlock(elseStmt, filePath, 'else', evidence);
    }
  }

  const forStatements = sourceFile.getDescendantsOfKind(SyntaxKind.ForStatement);
  for (const forStmt of forStatements) {
    checkBlock(forStmt.getStatement(), filePath, 'for', evidence);
  }

  const forOfStatements = sourceFile.getDescendantsOfKind(SyntaxKind.ForOfStatement);
  for (const stmt of forOfStatements) {
    checkBlock(stmt.getStatement(), filePath, 'for-of', evidence);
  }

  const forInStatements = sourceFile.getDescendantsOfKind(SyntaxKind.ForInStatement);
  for (const stmt of forInStatements) {
    checkBlock(stmt.getStatement(), filePath, 'for-in', evidence);
  }

  const whileStatements = sourceFile.getDescendantsOfKind(SyntaxKind.WhileStatement);
  for (const stmt of whileStatements) {
    checkBlock(stmt.getStatement(), filePath, 'while', evidence);
  }

  return evidence;
}

/**
 * Check if a statement node is a block with exactly one non-declaration
 * statement, and if so, add evidence for the unnecessary braces.
 */
function checkBlock(
  node: import('ts-morph').Node | undefined,
  filePath: string,
  keyword: string,
  evidence: Evidence[],
): void {
  if (!node) return;
  if (node.getKind() !== SyntaxKind.Block) return;

  const block = node.asKindOrThrow(SyntaxKind.Block);
  const statements = block.getStatements();

  if (statements.length !== 1) return;

  const onlyStmt = statements[0];
  if (!onlyStmt) return;

  // Variable declarations need braces for scoping; skip them
  if (onlyStmt.getKind() === SyntaxKind.VariableStatement) return;

  // Function/class declarations inside blocks are also fine
  if (onlyStmt.getKind() === SyntaxKind.FunctionDeclaration) return;
  if (onlyStmt.getKind() === SyntaxKind.ClassDeclaration) return;

  const line = block.getStartLineNumber();
  evidence.push({
    file: filePath,
    line,
    found: `${keyword} body uses braces around single statement`,
    expected: 'concise syntax without braces for single-statement body',
    context: onlyStmt.getText().slice(0, 80),
  });
}
