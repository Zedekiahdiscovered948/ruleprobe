/**
 * Advanced rule matchers: type-aware and tree-sitter checks.
 *
 * Contains matchers that require --project (type-aware AST checks)
 * or tree-sitter (Python/Go checks). Merged with other matcher
 * arrays in rule-extractor.ts.
 */

import type { RuleMatcher } from '../types.js';

/**
 * Matchers for type-aware TypeScript checks and tree-sitter
 * language checks (Python, Go).
 */
export const ADVANCED_RULE_MATCHERS: RuleMatcher[] = [
  // Type-aware checks (require --project flag)
  {
    id: 'type-no-implicit-any',
    patterns: [
      /\bno\s+implicit\s+any\b/i,
      /\bnoImplicitAny\b/i,
      /\bexplicit\s+type\s+annotations?\b/i,
      /\bavoid\s+implicit\s+any\b/i,
      /\ball\s+(?:variables?|params?|parameters?)\s+must\s+(?:have|be)\s+typed\b/i,
    ],
    category: 'type-safety',
    verifier: 'ast',
    description: 'No implicit any types (requires --project for type-aware analysis)',
    severity: 'warning',
    buildPattern: () => ({
      type: 'no-implicit-any', target: '*.ts', expected: false, scope: 'project',
    }),
  },
  {
    id: 'structure-no-unused-exports',
    patterns: [
      /\bno\s+unused\s+exports?\b/i,
      /\bremove\s+unused\s+exports?\b/i,
      /\bexports?\s+must\s+be\s+(?:used|imported|referenced)\b/i,
      /\bdon'?t\s+export\s+(?:unused|dead)\b/i,
      /\bno\s+dead\s+exports?\b/i,
    ],
    category: 'structure',
    verifier: 'ast',
    description: 'Exported declarations must be imported by other files (requires --project)',
    severity: 'warning',
    buildPattern: () => ({
      type: 'no-unused-exports', target: '*.ts', expected: false, scope: 'project',
    }),
  },
  {
    id: 'import-no-unresolved',
    patterns: [
      /\bno\s+unresolved\s+imports?\b/i,
      /\bimports?\s+must\s+(?:be\s+)?resolvable\b/i,
      /\bno\s+broken\s+imports?\b/i,
      /\ball\s+imports?\s+must\s+resolve\b/i,
    ],
    category: 'import-pattern',
    verifier: 'ast',
    description: 'All relative imports must resolve to existing files (requires --project)',
    severity: 'error',
    buildPattern: () => ({
      type: 'no-unresolved-imports', target: '*.ts', expected: false, scope: 'project',
    }),
  },

  // Tree-sitter checks (Python/Go)
  {
    id: 'naming-python-snake-case',
    patterns: [
      /\bpython\b.*\bsnake[_\s]*case\b/i,
      /\bsnake[_\s]*case\b.*\bpython\b/i,
      /\bpython\s+function\s+names?\b.*\bsnake/i,
    ],
    category: 'naming',
    verifier: 'treesitter',
    description: 'Python functions must use snake_case naming',
    severity: 'error',
    buildPattern: () => ({
      type: 'python-snake-case', target: 'python', expected: 'snake_case', scope: 'file',
    }),
  },
  {
    id: 'naming-python-class',
    patterns: [
      /\bpython\b.*\bclass\b.*\bPascal\s*Case\b/i,
      /\bPascal\s*Case\b.*\bpython\b.*\bclass/i,
      /\bpython\s+class\s+names?\b.*\bPascal/i,
    ],
    category: 'naming',
    verifier: 'treesitter',
    description: 'Python classes must use PascalCase naming',
    severity: 'error',
    buildPattern: () => ({
      type: 'python-class-naming', target: 'python', expected: 'PascalCase', scope: 'file',
    }),
  },
  {
    id: 'naming-go-conventions',
    patterns: [
      /\bgo\b.*\bnaming\s+conventions?\b/i,
      /\bgo\b.*\bPascalCase\b.*\bexported\b/i,
      /\bgo\b.*\bcamelCase\b.*\bunexported\b/i,
      /\bgo\s+(?:function|method)\s+naming\b/i,
    ],
    category: 'naming',
    verifier: 'treesitter',
    description: 'Go functions follow naming conventions (exported: PascalCase, unexported: camelCase)',
    severity: 'error',
    buildPattern: () => ({
      type: 'go-naming', target: 'go', expected: 'conventions', scope: 'file',
    }),
  },
  {
    id: 'style-python-function-length',
    patterns: [
      /\bpython\b.*\bmax(?:imum)?\s+(?:function|method)\s+length\b/i,
      /\bpython\b.*\bfunction\b.*\b(?:under|less\s+than|max|<=?)\s*\d+\s*lines?\b/i,
    ],
    category: 'code-style',
    verifier: 'treesitter',
    description: 'Python functions must not exceed maximum line count',
    severity: 'warning',
    buildPattern: (_line: string, match: RegExpMatchArray) => {
      const numMatch = match[0].match(/\d+/);
      const maxLines = numMatch ? numMatch[0] : '50';
      return {
        type: 'function-length', target: 'python', expected: maxLines, scope: 'file',
      };
    },
  },
  {
    id: 'style-go-function-length',
    patterns: [
      /\bgo\b.*\bmax(?:imum)?\s+(?:function|method)\s+length\b/i,
      /\bgo\b.*\bfunction\b.*\b(?:under|less\s+than|max|<=?)\s*\d+\s*lines?\b/i,
    ],
    category: 'code-style',
    verifier: 'treesitter',
    description: 'Go functions must not exceed maximum line count',
    severity: 'warning',
    buildPattern: (_line: string, match: RegExpMatchArray) => {
      const numMatch = match[0].match(/\d+/);
      const maxLines = numMatch ? numMatch[0] : '50';
      return {
        type: 'function-length', target: 'go', expected: maxLines, scope: 'file',
      };
    },
  },

  {
    id: 'style-concise-conditionals',
    patterns: [
      /\bavoid\b.*\b(?:unnecessary|unneeded)\s+(?:curly\s+)?braces?\b/i,
      /\b(?:unnecessary|unneeded)\s+(?:curly\s+)?braces?\b.*\bavoid\b/i,
      /\bconcise\s+(?:syntax|conditional|style)\b.*\b(?:if|conditional|brace)/i,
      /\bno\s+(?:curly\s+)?braces?\b.*\bsingle\b.*\bstatement/i,
      /\bsingle[\s-]line\b.*\bno\s+(?:curly\s+)?braces?\b/i,
    ],
    category: 'code-style',
    verifier: 'ast',
    description: 'Avoid unnecessary braces around single-statement bodies in conditionals',
    severity: 'warning',
    buildPattern: () => ({
      type: 'concise-conditionals', target: '*.ts', expected: false, scope: 'file',
    }),
  },

  // Filesystem checks
  {
    id: 'naming-kebab-case-directories',
    patterns: [
      /\bkebab[\s-]*case\b.*\b(?:director(?:y|ies)|folder)/i,
      /\b(?:director(?:y|ies)|folder)\b.*\bkebab[\s-]*case\b/i,
      /\blowercase\s+with\s+dashes?\b.*\b(?:director(?:y|ies)|folder)/i,
      /\b(?:director(?:y|ies)|folder)\b.*\blowercase\s+with\s+dashes?\b/i,
      /\b(?:director(?:y|ies)|folder)\s+names?:?\s*kebab/i,
    ],
    category: 'naming',
    verifier: 'filesystem',
    description: 'Directory names must use kebab-case (lowercase with dashes)',
    severity: 'error',
    buildPattern: () => ({
      type: 'kebab-case-directories', target: 'directories', expected: 'kebab-case', scope: 'project',
    }),
  },

  // Additional regex checks
  {
    id: 'forbidden-no-todo-comments',
    patterns: [
      /\bno\s+TODO\s+comments?\b/i,
      /\bTODO\b.*\bnot\s+allowed\b/i,
      /\bremove\s+(?:all\s+)?TODO\b/i,
      /\bno\s+(?:FIXME|HACK|XXX)\b/i,
      /\bclean\s+up\s+(?:TODO|FIXME)\b/i,
    ],
    category: 'code-style',
    verifier: 'regex',
    description: 'No TODO/FIXME/HACK/XXX comments in production code',
    severity: 'warning',
    buildPattern: () => ({
      type: 'no-todo-comments', target: '*.ts', expected: false, scope: 'file',
    }),
  },
  {
    id: 'style-consistent-semicolons',
    patterns: [
      /\bconsistent\s+semicolons?\b/i,
      /\balways\s+use\s+semicolons?\b/i,
      /\bno\s+semicolons?\b/i,
      /\brequire\s+semicolons?\b/i,
      /\bsemicolon\s+(?:style|usage|enforcement)\b/i,
    ],
    category: 'code-style',
    verifier: 'regex',
    description: 'Enforce consistent semicolon usage',
    severity: 'warning',
    buildPattern: (line: string) => {
      const noSemi = /\bno\s+semicolons?\b/i.test(line);
      return {
        type: 'consistent-semicolons', target: '*.ts', expected: noSemi ? 'never' : 'always', scope: 'file',
      };
    },
  },

  // Additional AST checks
  {
    id: 'forbidden-no-var',
    patterns: [
      /\bno\s+var\b/i,
      /\bdon'?t\s+use\s+var\b/i,
      /\bavoid\s+var\b/i,
      /\buse\s+(?:const|let)\s+instead\s+of\s+var\b/i,
      /\bnever\s+use\s+var\b/i,
      /\bvar\s+is\s+(?:not\s+allowed|forbidden|banned)\b/i,
    ],
    category: 'forbidden-pattern',
    verifier: 'ast',
    description: 'No var declarations (use const or let)',
    severity: 'error',
    buildPattern: () => ({
      type: 'no-var', target: '*.ts', expected: false, scope: 'file',
    }),
  },
  {
    id: 'style-prefer-const',
    patterns: [
      /\bprefer\s+const\b/i,
      /\buse\s+const\b.*\bnot\s+(?:let|reassigned)\b/i,
      /\bconst\s+over\s+let\b/i,
      /\bimmutable\s+by\s+default\b/i,
      /\bconst\s+(?:where|when)\s+possible\b/i,
    ],
    category: 'code-style',
    verifier: 'ast',
    description: 'Prefer const for variables that are never reassigned',
    severity: 'warning',
    buildPattern: () => ({
      type: 'prefer-const', target: '*.ts', expected: 'const', scope: 'file',
    }),
  },
  {
    id: 'import-no-wildcard-exports',
    patterns: [
      /\bno\s+(?:wildcard|star)\s+(?:re-?)?exports?\b/i,
      /\bavoid\s+export\s*\*/i,
      /\bdon'?t\s+use\s+export\s*\*/i,
      /\bno\s+export\s*\*\b/i,
      /\bnamed\s+re-?exports?\s+(?:only|instead)\b/i,
    ],
    category: 'import-pattern',
    verifier: 'ast',
    description: 'No wildcard re-exports (use named re-exports)',
    severity: 'warning',
    buildPattern: () => ({
      type: 'no-wildcard-exports', target: '*.ts', expected: false, scope: 'file',
    }),
  },
];
