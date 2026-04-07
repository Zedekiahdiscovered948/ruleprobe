/**
 * Type-aware AST checks that require a ts-morph Project with a tsconfig.
 *
 * These checks use the TypeChecker to detect issues that per-file
 * parsing cannot catch: implicit any, unused exports, and unresolved
 * imports. They are only active when --project is passed.
 */

import { SyntaxKind, type SourceFile, type Project, type Type, Node } from 'ts-morph';
import type { Evidence } from '../types.js';
import { getLineNumber, getContext } from './helpers.js';

/**
 * Check whether a type is the implicit "any" (as opposed to explicit `any` annotation).
 *
 * When noImplicitAny would flag a declaration, the type checker still
 * assigns it the "any" type but without an explicit annotation.
 */
function isImplicitAny(type: Type): boolean {
  return type.getText() === 'any';
}

/**
 * Detect variables and parameters with implicitly inferred "any" type.
 *
 * Only meaningful when the Project has a real tsconfig, since without
 * type resolution, everything is inferred loosely. Checks variable
 * declarations without type annotations whose inferred type is "any".
 *
 * @param sourceFile - Source file to check
 * @param filePath - Absolute path for evidence
 * @param project - The ts-morph Project (must have type-checking enabled)
 * @returns Evidence of implicit any findings
 */
export function checkImplicitAny(
  sourceFile: SourceFile,
  filePath: string,
  project: Project,
): Evidence[] {
  const evidence: Evidence[] = [];
  const typeChecker = project.getTypeChecker();

  // Check variable declarations without explicit type annotations
  const varDecls = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
  for (const decl of varDecls) {
    // Skip if the declaration has an explicit type annotation
    if (decl.getTypeNode()) {
      continue;
    }
    // Skip if it has an initializer (which gives it a concrete type)
    if (decl.getInitializer()) {
      continue;
    }
    const type = typeChecker.getTypeAtLocation(decl);
    if (isImplicitAny(type)) {
      evidence.push({
        file: filePath,
        line: getLineNumber(decl),
        found: `${decl.getName()} has implicit any type`,
        expected: 'explicit type annotation',
        context: getContext(decl),
      });
    }
  }

  // Check function parameters without annotations
  const params = sourceFile.getDescendantsOfKind(SyntaxKind.Parameter);
  for (const param of params) {
    if (param.getTypeNode()) {
      continue;
    }
    const type = typeChecker.getTypeAtLocation(param);
    if (isImplicitAny(type)) {
      const name = param.getName();
      evidence.push({
        file: filePath,
        line: getLineNumber(param),
        found: `parameter "${name}" has implicit any type`,
        expected: 'explicit type annotation on parameter',
        context: getContext(param),
      });
    }
  }

  return evidence;
}

/**
 * Detect exported declarations that are never imported by other files in the project.
 *
 * Requires a full Project so the language service can resolve references
 * across files. Only checks named exports (not default exports, which have
 * their own rule).
 *
 * @param sourceFile - Source file to check
 * @param filePath - Absolute path for evidence
 * @param project - The ts-morph Project with all files loaded
 * @returns Evidence of unused exports
 */
export function checkUnusedExports(
  sourceFile: SourceFile,
  filePath: string,
  project: Project,
): Evidence[] {
  const evidence: Evidence[] = [];

  const exportedDecls = sourceFile.getExportedDeclarations();

  for (const [name, declarations] of exportedDecls) {
    // Skip entries like "default"
    if (name === 'default') {
      continue;
    }

    for (const decl of declarations) {
      // findReferencesAsNodes is on ReferenceFindableNode, not all declarations
      if (!Node.isReferenceFindable(decl)) {
        continue;
      }

      const refs = (decl as Node & { findReferencesAsNodes(): Node[] }).findReferencesAsNodes();
      // Filter out references in the same file (self-references)
      const externalRefs = refs.filter(
        (ref: Node) => ref.getSourceFile().getFilePath() !== sourceFile.getFilePath(),
      );

      if (externalRefs.length === 0) {
        evidence.push({
          file: filePath,
          line: getLineNumber(decl),
          found: `export "${name}" has no external references`,
          expected: 'exported declarations should be imported elsewhere',
          context: getContext(decl),
        });
      }
    }
  }

  return evidence;
}

/**
 * Detect import specifiers that cannot be resolved by the TypeChecker.
 *
 * Uses the type checker's module resolution. If a module specifier
 * resolves to "any" or fails, it indicates an unresolved import.
 *
 * @param sourceFile - Source file to check
 * @param filePath - Absolute path for evidence
 * @param project - The ts-morph Project
 * @returns Evidence of unresolved imports
 */
export function checkUnresolvedImports(
  sourceFile: SourceFile,
  filePath: string,
  project: Project,
): Evidence[] {
  const evidence: Evidence[] = [];

  const importDecls = sourceFile.getImportDeclarations();
  for (const importDecl of importDecls) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();

    // Try to resolve the referenced source file
    const referencedFile = importDecl.getModuleSpecifierSourceFile();
    if (!referencedFile) {
      // Could be an external package (node_modules), skip those
      if (moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('/')) {
        evidence.push({
          file: filePath,
          line: getLineNumber(importDecl),
          found: `import "${moduleSpecifier}" cannot be resolved`,
          expected: 'resolvable module specifier',
          context: getContext(importDecl),
        });
      }
    }
  }

  return evidence;
}
