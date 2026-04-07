# Built-in Matchers

RuleProbe ships 51 matchers across 9 categories. Each matcher maps a natural-language instruction to a deterministic check.

The parser is conservative: if it can't confidently map an instruction to a check, it skips it and reports the line as unparseable. Use `--show-unparseable` to see skipped lines, and `--llm-extract` or `--rubric-decompose` to handle the remainder.

## Verifier Types

| Verifier | Scope | Notes |
|----------|-------|-------|
| AST | TypeScript / JavaScript | Full structural analysis via ts-morph |
| AST (--project) | TypeScript / JavaScript | Requires `--project tsconfig.json` for cross-file type checking |
| Tree-sitter | Python, Go | Naming and function-length checks via WASM grammars |
| Regex | Any text file | Line-level pattern matching |
| Filesystem | Disk structure | File existence, naming, config presence |

## Matcher Table

| Category | Example instruction | What gets checked | Verifier |
|----------|-------------------|-------------------|----------|
| naming | "camelCase for variables" | Variable and function names in AST | AST |
| naming | "camelCase" (general) | Variable and function names in AST | AST |
| naming | "PascalCase for types" | Interface and type alias names | AST |
| naming | "kebab-case file names" | File names on disk | Filesystem |
| naming | "Python snake_case functions" | Python function names via tree-sitter | Tree-sitter |
| naming | "Python PascalCase classes" | Python class names via tree-sitter | Tree-sitter |
| naming | "Go naming conventions" | Exported PascalCase, unexported camelCase | Tree-sitter |
| forbidden-pattern | "no any types" | Type annotations in AST | AST |
| forbidden-pattern | "no console.log" | Call expressions in AST | AST |
| forbidden-pattern | "no console.warn/error" | Extended console method calls | AST |
| forbidden-pattern | "no var" | Var declarations in all scopes | AST |
| forbidden-pattern | "no TODO/FIXME comments" | Comment marker detection | Regex |
| forbidden-pattern | "max line length" | Line character count | Regex |
| structure | "named exports only" | Export declarations | AST |
| structure | "JSDoc on public functions" | JSDoc presence | AST |
| structure | "max 300 lines per file" | File line count | Filesystem |
| structure | "strict mode" | tsconfig.json compilerOptions.strict | Filesystem |
| structure | "no barrel files" | Index re-export detection | AST |
| structure | "README must exist" | File existence on disk | Filesystem |
| structure | "CHANGELOG must exist" | File existence on disk | Filesystem |
| structure | "formatter config required" | .prettierrc / .eslintrc detection | Filesystem |
| structure | "no unused exports" | Exported symbols imported elsewhere | AST (--project) |
| test-requirement | "test file for every source file" | Matching test files exist | Filesystem |
| test-requirement | "test files named *.test.ts" | Test file naming convention | Filesystem |
| test-requirement | "no .only in tests" | Focused test detection | Regex |
| test-requirement | "no .skip in tests" | Skipped test detection | Regex |
| test-requirement | "no setTimeout in tests" | Timer usage in test files | AST |
| import-pattern | "no path aliases" | Import specifiers | AST |
| import-pattern | "no deep relative imports" | Import depth | AST |
| import-pattern | "no namespace imports" | Star import detection | AST |
| import-pattern | "ban specific packages" | Forbidden import sources | Regex |
| import-pattern | "no unresolved imports" | Relative import resolution | AST (--project) |
| import-pattern | "no wildcard re-exports" | `export *` detection | AST |
| error-handling | "no empty catch blocks" | Catch clause body inspection | AST |
| error-handling | "throw Error instances only" | Throw expression types | AST |
| type-safety | "no enums" | Enum declaration detection | AST |
| type-safety | "no type assertions" | `as` keyword / angle bracket casts | AST |
| type-safety | "no non-null assertions" | `!` postfix operator | AST |
| type-safety | "no @ts-ignore / @ts-nocheck" | Directive comment detection | Regex |
| type-safety | "no implicit any" | Untyped parameters and variables | AST (--project) |
| code-style | "no nested ternary" | Ternary depth analysis | AST |
| code-style | "no magic numbers" | Numeric literal usage | AST |
| code-style | "no else after return" | Redundant else branches | AST |
| code-style | "max function length" | Function body line count | AST |
| code-style | "max parameters per function" | Parameter count | AST |
| code-style | "single/double quote style" | Quote consistency in imports | Regex |
| code-style | "prefer const" | `let` that is never reassigned | AST |
| code-style | "consistent semicolons" | Missing or unexpected semicolons | Regex |
| code-style | "Python max function length" | Python function body line count | Tree-sitter |
| code-style | "Go max function length" | Go function body line count | Tree-sitter |
| dependency | "pin dependency versions" | Exact version strings in package.json | Filesystem |

## Adding Matchers

Matchers are defined in `src/parsers/rule-patterns*.ts`. Each matcher has:

- **id**: unique slug (e.g., `naming-camelCase-1`)
- **category**: one of the 9 categories above
- **keywords / pattern**: regex that matches the natural-language instruction
- **verifier**: which engine runs the check (`ast`, `regex`, `filesystem`, `treesitter`)
- **patternType**: the specific check function (e.g., `camelCase`, `no-any`, `max-line-length`)
- **filePattern**: glob for target files (e.g., `*.ts`, `*.py`)

To add a new matcher, add an entry to the appropriate `rule-patterns*.ts` file, implement the check function in the corresponding verifier module, and add tests.
