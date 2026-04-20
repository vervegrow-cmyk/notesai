import { useEffect, useRef } from 'react';
import type { Product, ChatMessage, PricingResult, Phase } from '../../types';
import { PriceCard } from '../components/PriceCard';

const CONFIDENCE_LABEL: Record<string, string> = {
  high: '高 ✅', medium: '中 ⚠️', low: '低 ❓',
};

export interface ChatPanelProps {
  product: Product | null;
  messages: ChatMessage[];
  loading: boolean;
  result: PricingResult | null;
  error: string;
  userInput: string;
  phase: Phase;
  thumbnail?: string;
  compact?: boolean;
  fromSpreadsheet: boolean;
  onSendAnswer: () => void;
  onInputChange: (val: string) => void;
  onClose: () => void;
  onReset: () => void;
  onGoToSelect: () => void;
}

export function ChatPanel({
  product, messages, loading, result, error, userInput,
  phase, thumbnail, compact = false, fromSpreadsheet,
  onSendAnswer, onInputChange, onClose, onReset, onGoToSelect,
}: ChatPanelProps) {
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading && !result) inputRef.current?.focus();
  }, [loading, result]);

  const headerThumb = thumbnail;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col ${compact ? 'h-[calc(100vh-6rem)]' : 'h-[580px] sm:h-[640px]'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-[#0f172a] rounded-t-2xl flex-shrink-0">
        {headerThumb ? (
          <img src={headerThumb} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center text-base flex-shrink-0">📦</div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{product?.name}</p>
          <p className="text-xs text-slate-400">{product?.category}</p>
        </div>
        {phase === 'select' ? (
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none px-1">✕</button>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-xs text-slate-400">{result ? 'Done' : 'Analyzing'}</span>
          </div>
        )}
      </div>

      {result ? (
        /* Result view */
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-white font-bold text-sm">估价完成</p>
              <p className="text-white/70 text-xs">{product?.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <PriceCard label="收货价" value={result.estimated_price} accent="violet" />
            <PriceCard label="转售价" value={result.resale_price} accent="indigo" />
            <PriceCard label="快速出货" value={result.quick_sale_price} accent="slate" />
            <PriceCard label="置信度" value={CONFIDENCE_LABEL[result.confidence] ?? result.confidence} accent="slate" />
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">AI 分析</p>
            <p className="text-xs text-slate-700 leading-relaxed">{result.reason}</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {phase === 'select' ? (
              <button onClick={onClose} className="py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:border-slate-300 transition-all">
                ← 其他产品
              </button>
            ) : fromSpreadsheet ? (
              <button onClick={onGoToSelect} className="py-2.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-xs font-semibold transition-all">
                ← Products
              </button>
            ) : (
              <button onClick={onReset} className="py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold transition-all">
                ↺ New
              </button>
            )}
            <button
              onClick={() => {
                const text = `Product: ${product?.name}\nPurchase: ${result.estimated_price}\nResale: ${result.resale_price}\nQuick Sale: ${result.quick_sale_price}`;
                navigator.clipboard.writeText(text);
              }}
              className="py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold shadow-sm"
            >
              Copy
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages
              .filter(m => m.role === 'assistant' || (m.role === 'user' && !m.content.startsWith('商品信息：')))
              .map((msg, i) => (
                <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs flex-shrink-0 mb-0.5">🤖</div>
                  )}
                  <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' ? 'bg-[#0f172a] text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs flex-shrink-0">🤖</div>
                <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <span className="flex gap-1">
                    {[0, 150, 300].map(delay => (
                      <span key={delay} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl space-y-2 flex-shrink-0">
            {error && <p className="text-xs text-red-500 px-1">⚠️ {error}</p>}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={e => onInputChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSendAnswer()}
                placeholder="Type your answer..."
                disabled={loading}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition disabled:opacity-50"
              />
              <button
                onClick={onSendAnswer}
                disabled={!userInput.trim() || loading}
                className="px-3.5 py-2.5 bg-[#0f172a] hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
              >
                <span className="hidden sm:inline text-xs">Send</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
