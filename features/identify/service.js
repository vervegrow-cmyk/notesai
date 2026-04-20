import { identifyProduct } from '../../agents/identifyAgent.js';

export async function analyzeProduct({ image, text }) {
  return identifyProduct({ image, text });
}
