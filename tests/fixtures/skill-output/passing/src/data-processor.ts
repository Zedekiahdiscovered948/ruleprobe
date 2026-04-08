export interface ProcessResult {
  id: string;
  value: number;
}

export function processData(inputValue: number): ProcessResult {
  const resultId = generateId();
  const doubled = inputValue * 2;
  return { id: resultId, value: doubled };
}

export function formatResult(result: ProcessResult): string {
  return `${result.id}: ${result.value}`;
}

function generateId(): string {
  return Math.random().toString(36).slice(2);
}
