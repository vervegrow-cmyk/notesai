import { useState } from 'react';

export default function App() {
  const [product, setProduct] = useState('');
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!product.trim()) return;
    setLoading(true);
    setScript('');
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: product.trim() }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setScript(data.result ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = script.split(/\s+/).filter(Boolean).length;
  const seconds = Math.round((wordCount / 150) * 60);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-xl">

        <div className="text-center mb-10">
          <div className="text-4xl mb-3">🎬</div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            AI TikTok Script Generator
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Enter your product and get a viral-ready script in seconds
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Your Product
            </label>
            <input
              type="text"
              value={product}
              onChange={e => setProduct(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. Wireless Earbuds, Matcha Powder, Yoga Mat..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition text-sm"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!product.trim() || loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating...
              </>
            ) : (
              'Generate Script'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        {script && (
          <div className="mt-5 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-700">Generated Script</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{wordCount} words · ~{seconds}s video</span>
                <button
                  onClick={handleCopy}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 transition-colors"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
              {script}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
