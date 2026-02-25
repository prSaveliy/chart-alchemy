export function* randomLetterGenerator(): Generator<string> {
  const LETTERS = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
    'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
    'u', 'v', 'w', 'x', 'y', 'z'
  ]

  while (true) {
    const isUpperCase = Math.round(Math.random());
    const option = LETTERS[Math.floor(Math.random() * 26)];
    const letter = isUpperCase
      ? option.toUpperCase()
      : option;
    
    yield letter;
  }
}

export async function generateString<T>(iterator: Iterator<T>, timeout: number): Promise<string> {
  const endTime = Date.now() + timeout * 1000;
  let string = '';
  
  while (Date.now() < endTime) {
    const { value } = iterator.next();
    string += value;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return string;
}