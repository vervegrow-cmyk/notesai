import { success, fail } from '../../backend/api-core/response.js';
import { ErrorCode } from '../../backend/api-core/errors.js';
import { generateContent } from './service.js';

export async function generateController(body) {
  const { input } = body ?? {};
  if (!input) {
    return fail(ErrorCode.VALIDATION_ERROR, 'Missing input');
  }
  try {
    const result = await generateContent(input);
    return success(result);
  } catch (err) {
    console.error('[generate] error:', err.message);
    return fail(ErrorCode.AI_ERROR, 'AI generation failed');
  }
}
