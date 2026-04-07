// Fixture: code with unnecessary braces around single-statement bodies
function processData(x: number): string {
  if (x > 10) {
    return 'big';
  }

  if (x < 0) {
    return 'negative';
  } else {
    return 'small';
  }
}

function loopExample(items: string[]): void {
  for (const item of items) {
    console.log(item);
  }

  for (let i = 0; i < items.length; i++) {
    console.log(i);
  }
}
