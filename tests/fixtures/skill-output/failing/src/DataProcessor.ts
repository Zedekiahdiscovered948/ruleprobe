/* Fixture: violates kebab-case filename, camelCase, no-var, no-console-log, and named-exports-only */

var global_counter = 0;

export function process_data(input_value: number): void {
  var local_temp = input_value + 1;
  console.log("Processing value:", input_value);
  global_counter = local_temp;
}

export default function defaultHandler(): string {
  console.log("default export called");
  return "handled";
}
