# Example Instruction File

This is a sample instruction file demonstrating the kinds of rules RuleProbe can extract and verify. Use it to test the CLI or as a starting point for your own project's instruction file.

## Code Standards

- TypeScript strict mode
- No any types anywhere in the codebase
- Named exports only, no default exports
- No console.log in production code
- No empty catch blocks; always handle or rethrow errors
- Don't use enums; prefer union types
- No type assertions (as casts)
- No non-null assertions (!)
- Only throw Error objects, never throw strings or other types
- Avoid nested ternary expressions
- No magic numbers; extract constants
- No ts-ignore or ts-nocheck directives
- Avoid else after return
- Prefer const over let when the variable is never reassigned
- Don't use var; use const or let

## Naming

- File names: kebab-case (e.g., user-service.ts, api-handler.ts)
- Variable and function names: camelCase
- Type and interface names: PascalCase

## Structure

- Every public function has a JSDoc comment describing its contract
- Maximum file length: 300 lines
- Maximum function length: 50 lines
- Maximum 4 parameters per function
- No barrel files or index re-exports

## Testing

- Test files: co-located in tests/ directory, named *.test.ts
- All files must have tests
- No setTimeout or setInterval in test files

## Imports

- Imports use relative paths, no path aliases
- No relative imports deeper than 2 levels
- No namespace imports (import * as)
- No wildcard exports (export * from)

## Dependencies

- All dependencies pinned to exact versions, no ^ or ~ ranges
