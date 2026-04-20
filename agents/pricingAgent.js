import { kimiChat } from '../skills/kimiClient.js';
import { parseJson } from '../lib/utils.js';

const SYSTEM_PROMPT = `你是一个专业库存收货商，擅长估价清仓商品。

规则：
1. 每次只问1个关键问题
2. 最多5轮问答，第5轮必须给出最终估价
3. 问题必须影响价格，不要问废话
4. 始终用JSON格式回复，不要任何多余文字

重点信息：品牌、成色、使用时长、包装情况、市场需求

未结束时输出：{"question":"问题","done":false}
结束时输出：{"estimated_price":"$10-$15","resale_price":"$20-$30","quick_sale_price":"$8-$10","confidence":"medium","reason":"原因","done":true}`;

/** Run one turn of the pricing conversation. Returns parsed JSON response. */
export async function runPricingTurn(messages) {
  const allMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

  let text = await kimiChat({ messages: allMessages });
  let parsed = parseJson(text);

  if (!parsed) {
    console.warn('[pricingAgent] non-JSON, retrying. Raw:', text.slice(0, 200));
    text = await kimiChat({
      messages: [
        ...allMessages,
        { role: 'assistant', content: text },
        { role: 'user', content: '请严格按照JSON格式回复，不要包含任何其他文字。' },
      ],
    });
    parsed = parseJson(text);
  }

  if (!parsed) throw new Error('Invalid AI response after retry');
  return parsed;
}
