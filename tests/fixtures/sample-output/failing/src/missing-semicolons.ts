/* Fixture: inconsistent semicolons (should fail consistent-semicolons "always" check) */

export const name = 'test'
export const value = 42

export function add(a: number, b: number): number {
  const result = a + b;
  return result
}
