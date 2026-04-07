/**
 * Tree-sitter language-specific checks.
 *
 * Naming, function length, and structural checks for Python
 * and Go files. Uses the tree-sitter node types from the
 * loader module.
 */

import type { Evidence } from '../types.js';
import type { TreeSitterNode } from './treesitter-loader.js';
import { collectNodesByType } from './treesitter-loader.js';

/**
 * Check function naming conventions in Python files.
 *
 * Python convention: functions use snake_case.
 */
export function checkPythonSnakeCase(root: TreeSitterNode, filePath: string): Evidence[] {
  const evidence: Evidence[] = [];
  const funcDefs = collectNodesByType(root, 'function_definition');

  for (const func of funcDefs) {
    const nameNode = func.childForFieldName('name');
    if (!nameNode) {
      continue;
    }
    const name = nameNode.text;
    if (name.startsWith('__') && name.endsWith('__')) {
      continue;
    }
    if (!isSnakeCase(name)) {
      evidence.push({
        file: filePath,
        line: nameNode.startPosition.row + 1,
        found: `function "${name}" is not snake_case`,
        expected: 'snake_case function names',
        context: func.text.split('\n').slice(0, 3).join('\n'),
      });
    }
  }

  return evidence;
}

/**
 * Check that Python classes use PascalCase naming.
 */
export function checkPythonClassNaming(root: TreeSitterNode, filePath: string): Evidence[] {
  const evidence: Evidence[] = [];
  const classDefs = collectNodesByType(root, 'class_definition');

  for (const cls of classDefs) {
    const nameNode = cls.childForFieldName('name');
    if (!nameNode) {
      continue;
    }
    const name = nameNode.text;
    if (!isPascalCase(name)) {
      evidence.push({
        file: filePath,
        line: nameNode.startPosition.row + 1,
        found: `class "${name}" is not PascalCase`,
        expected: 'PascalCase class names',
        context: cls.text.split('\n').slice(0, 3).join('\n'),
      });
    }
  }

  return evidence;
}

/**
 * Check function naming conventions in Go files.
 *
 * Exported: PascalCase, unexported: camelCase.
 */
export function checkGoNaming(root: TreeSitterNode, filePath: string): Evidence[] {
  const evidence: Evidence[] = [];
  const funcDefs = collectNodesByType(root, 'function_declaration');

  for (const func of funcDefs) {
    const nameNode = func.childForFieldName('name');
    if (!nameNode) {
      continue;
    }
    const name = nameNode.text;
    const firstChar = name.charAt(0);
    if (firstChar === firstChar.toUpperCase()) {
      if (!isPascalCase(name)) {
        evidence.push({
          file: filePath,
          line: nameNode.startPosition.row + 1,
          found: `exported function "${name}" is not PascalCase`,
          expected: 'PascalCase for exported Go functions',
          context: func.text.split('\n').slice(0, 3).join('\n'),
        });
      }
    } else {
      if (!isCamelCase(name)) {
        evidence.push({
          file: filePath,
          line: nameNode.startPosition.row + 1,
          found: `unexported function "${name}" is not camelCase`,
          expected: 'camelCase for unexported Go functions',
          context: func.text.split('\n').slice(0, 3).join('\n'),
        });
      }
    }
  }

  return evidence;
}

/**
 * Check maximum function length across any tree-sitter-supported language.
 */
export function checkFunctionLength(
  root: TreeSitterNode,
  filePath: string,
  maxLines: number,
  funcTypes: string[],
): Evidence[] {
  const evidence: Evidence[] = [];

  for (const funcType of funcTypes) {
    const funcs = collectNodesByType(root, funcType);
    for (const func of funcs) {
      const startLine = func.startPosition.row + 1;
      const endLine = func.endPosition.row + 1;
      const length = endLine - startLine + 1;

      if (length > maxLines) {
        const nameNode = func.childForFieldName('name');
        const name = nameNode?.text ?? '<anonymous>';
        evidence.push({
          file: filePath,
          line: startLine,
          found: `function "${name}" is ${length} lines (max: ${maxLines})`,
          expected: `functions should be <= ${maxLines} lines`,
          context: func.text.split('\n').slice(0, 3).join('\n'),
        });
      }
    }
  }

  return evidence;
}

// ── helpers ──

function isSnakeCase(s: string): boolean {
  return /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(s);
}

function isPascalCase(s: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(s);
}

function isCamelCase(s: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(s);
}
