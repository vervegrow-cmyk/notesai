import { success, fail } from '../../backend/api-core/response.js';
import { ErrorCode } from '../../backend/api-core/errors.js';
import { analyzeProduct } from './service.js';

export async function identifyController(body) {
  const { image, text } = body ?? {};
  if (!image && !text) {
    return fail(ErrorCode.VALIDATION_ERROR, 'Missing image or text');
  }
  try {
    const result = await analyzeProduct({ image, text });
    return success(result);
  } catch (err) {
    console.error('[identify] error:', err.message);
    return fail(ErrorCode.AI_ERROR, 'AI identification failed');
  }
}
