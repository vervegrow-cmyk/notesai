import { runPricingTurn } from '../../agents/pricingAgent.js';

export async function calculatePricing(messages) {
  return runPricingTurn(messages);
}
