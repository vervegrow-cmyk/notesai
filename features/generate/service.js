import { kimiGenerate } from '../../skills/kimiGenerate.js';

export async function generateContent(input) {
  const result = await kimiGenerate(input);
  return { result };
}
