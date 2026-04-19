import { useState, useRef, useEffect } from 'react';

type Phase = 'upload' | 'chatting' | 'done';

interface Product {
  name: string;
  category: string;
  brand: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PricingResult {
  estimated_price: string;
  resale_price: string;
  quick_sale_price: string;
  confidence: string;
  reason: string;
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: '高 ✅',
  medium: '中 ⚠️',
  low: '低 ❓',
};

export default function App() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [imageBase64, setImageBase64] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  function reset() {
    setPhase('upload');
    setImageBase64('');
    setImagePreview('');
    setProduct(null);
    setMessages([]);
    setUserInput('');
    setResult(null);
    setError('');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('图片不能超过 10MB');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      // strip "data:image/...;base64," prefix
      setImageBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }

  async function handleStartValuation() {
    if (!imageBase64) return;
    setLoading(true);
    setError('');

    try {
      // Step 1: identify
      const idRes = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 }),
      });
      if (!idRes.ok) throw new Error(`识别失败 (${idRes.status})`);
      const identified: Product = await idRes.json();
      setProduct(identified);

      // Step 2: first chat turn with product info
      const firstUserMsg: Message = {
        role: 'user',
        content: `商品信息：名称=${identified.name}，类别=${identified.category}，品牌=${identified.brand}`,
      };
      const nextMessages = [firstUserMsg];

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!chatRes.ok) throw new Error(`对话失败 (${chatRes.status})`);
      const chatData = await chatRes.json();

      if (chatData.done) {
        setResult(chatData);
        setMessages([firstUserMsg, { role: 'assistant', content: chatData.reason }]);
        setPhase('done');
      } else {
        setMessages([firstUserMsg, { role: 'assistant', content: chatData.question }]);
        setPhase('chatting');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendAnswer() {
    if (!userInput.trim() || loading) return;
    const answer = userInput.trim();
    setUserInput('');
    setError('');

    const newMessages: Message[] = [...messages, { role: 'user', content: answer }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!res.ok) throw new Error(`对话失败 (${res.status})`);
      const data = await res.json();

      if (data.done) {
        setResult(data);
        setMessages([...newMessages, { role: 'assistant', content: data.reason }]);
        setPhase('done');
      } else {
        setMessages([...newMessages, { role: 'assistant', content: data.question }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📦</div>
          <h1 className="text-2xl font-bold text-slate-900">AI 库存估价工具</h1>
          <p className="text-slate-500 text-sm mt-1">上传商品图片，AI 多轮询问后给出专业估价</p>
        </div>

        {/* ── Phase: upload ── */}
        {phase === 'upload' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="预览" className="mx-auto max-h-48 rounded-lg object-contain" />
              ) : (
                <>
                  <div className="text-4xl mb-2">📷</div>
                  <p className="text-slate-500 text-sm">点击上传商品图片</p>
                  <p className="text-slate-400 text-xs mt-1">支持 JPG / PNG，≤ 10MB</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              onClick={handleStartValuation}
              disabled={!imageBase64 || loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  正在识别商品...
                </>
              ) : '开始估价'}
            </button>
          </div>
        )}

        {/* ── Phase: chatting ── */}
        {phase === 'chatting' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Product info bar */}
            {product && (
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50">
                {imagePreview && (
                  <img src={imagePreview} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-800">{product.name}</p>
                  <p className="text-xs text-slate-400">{product.brand} · {product.category}</p>
                </div>
              </div>
            )}

            {/* Chat messages */}
            <div className="h-72 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            {error && <p className="px-4 pb-1 text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2 p-4 border-t border-slate-100">
              <input
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendAnswer()}
                placeholder="输入你的回答..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition disabled:opacity-50"
              />
              <button
                onClick={handleSendAnswer}
                disabled={!userInput.trim() || loading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors"
              >
                发送
              </button>
            </div>
          </div>
        )}

        {/* ── Phase: done ── */}
        {phase === 'done' && result && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="text-center mb-5">
              <div className="text-3xl mb-1">✅</div>
              <p className="font-semibold text-slate-800">估价完成</p>
              {product && <p className="text-slate-400 text-sm mt-0.5">{product.name}</p>}
            </div>

            <div className="space-y-3">
              <PriceRow emoji="💰" label="收货价" value={result.estimated_price} highlight />
              <PriceRow emoji="📈" label="转售价" value={result.resale_price} />
              <PriceRow emoji="⚡" label="快速出货价" value={result.quick_sale_price} />
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <span className="text-sm text-slate-500">📊 置信度</span>
                <span className="text-sm font-medium text-slate-700">
                  {CONFIDENCE_LABEL[result.confidence] ?? result.confidence}
                </span>
              </div>
              <div className="pt-1">
                <p className="text-xs text-slate-400 mb-1">🧠 估价原因</p>
                <p className="text-sm text-slate-600 leading-relaxed">{result.reason}</p>
              </div>
            </div>

            <button
              onClick={reset}
              className="mt-6 w-full py-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-sm text-slate-600 transition-colors"
            >
              重新估价
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PriceRow({ emoji, label, value, highlight }: {
  emoji: string; label: string; value: string; highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-slate-100 ${highlight ? 'bg-blue-50 -mx-2 px-2 rounded-lg' : ''}`}>
      <span className="text-sm text-slate-500">{emoji} {label}</span>
      <span className={`text-sm font-bold ${highlight ? 'text-blue-600 text-base' : 'text-slate-700'}`}>{value}</span>
    </div>
  );
}
