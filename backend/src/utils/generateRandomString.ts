export function* randomLetterGenerator(): Generator<string> {
  const LETTERS = 'abcdefghijklmnopqrstuvwxyz';
  const LETTERS_ARRAY = LETTERS.split('');

  while (true) {
    const isUpperCase = Math.round(Math.random());
    const option = LETTERS_ARRAY[Math.floor(Math.random() * 26)];
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