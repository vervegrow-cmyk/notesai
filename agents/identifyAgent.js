import { kimiVisionIdentify, kimiTextIdentify } from '../skills/kimiVision.js';

/** Dispatch to vision or text identification based on input type. */
export async function identifyProduct({ image, text }) {
  if (image) return kimiVisionIdentify(image);
  if (text) return kimiTextIdentify(text);
  throw new Error('No image or text provided');
}
