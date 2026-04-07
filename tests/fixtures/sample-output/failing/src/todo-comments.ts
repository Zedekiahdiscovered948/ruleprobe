/* Fixture: code with TODO/FIXME comments (should fail no-todo-comments check) */

export function fetchData(url: string): Promise<string> {
  // TODO: add retry logic
  // FIXME: handle network errors
  return fetch(url).then(r => r.text());
}

// HACK: temporary workaround for auth
export const AUTH_TOKEN = 'placeholder';

// XXX: this needs refactoring
export function parse(input: string): string[] {
  return input.split(',');
}
