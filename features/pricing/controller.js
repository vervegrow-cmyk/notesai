import { success, fail } from '../../backend/api-core/response.js';
import { ErrorCode } from '../../backend/api-core/errors.js';
import { calculatePricing } from './service.js';

export async function pricingController(body) {
  const { messages } = body ?? {};
  if (!messages || !Array.isArray(messages)) {
    return fail(ErrorCode.VALIDATION_ERROR, 'Missing messages array');
  }
  try {
    const result = await calculatePricing(messages);
    return success(result);
  } catch (err) {
    console.error('[pricing] error:', err.message);
    return fail(ErrorCode.AI_ERROR, 'AI pricing failed');
  }
}
