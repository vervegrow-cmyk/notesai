import { kimiChat } from './kimiClient.js';

/** Free-form content generation — no structured output required. */
export async function kimiGenerate(input) {
  return kimiChat({
    messages: [{ role: 'user', content: input }],
  });
}
