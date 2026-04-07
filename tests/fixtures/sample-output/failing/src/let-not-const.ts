/* Fixture: let that could be const (should fail prefer-const check) */

export function processData(input: string[]): string {
  let separator = ', ';
  let result = input.join(separator);
  return result;
}

export function compute(a: number, b: number): number {
  let sum = a + b;
  return sum;
}

export function mutable(): number {
  let counter = 0;
  counter += 1;
  counter += 2;
  return counter;
}
