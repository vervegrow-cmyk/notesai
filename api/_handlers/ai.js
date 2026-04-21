import { pricingController }  from '../../features/pricing/controller.js';
import { identifyController } from '../../features/identify/controller.js';
import { groupController }    from '../../features/identify/groupController.js';

function toStatus(result) {
  if (result.success) return 200;
  return result.error?.code === 'VALIDATION_ERROR' ? 400 : 500;
}

export async function pricingCalculate(req, res) {
  const result = await pricingController(req.body);
  return res.status(toStatus(result)).json(result);
}

export async function identifyAnalyze(req, res) {
  const result = await identifyController(req.body);
  return res.status(toStatus(result)).json(result);
}

export async function identifyGroup(req, res) {
  const result = await groupController(req.body);
  return res.status(toStatus(result)).json(result);
}
