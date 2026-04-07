/* Fixture: code that uses var declarations (should fail no-var check) */

var globalCounter = 0;

export function increment(): number {
  var localTemp = globalCounter + 1;
  globalCounter = localTemp;
  return globalCounter;
}

export function getValues(): string[] {
  var items: string[] = [];
  for (var i = 0; i < 10; i++) {
    items.push(String(i));
  }
  return items;
}
