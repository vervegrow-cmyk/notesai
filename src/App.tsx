import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';

type Phase = 'upload' | 'chatting' | 'done';
type FileType = 'image' | 'video' | 'spreadsheet';

interface Product { name: string; category: string; brand: string; }
interface Message { role: 'user' | 'assistant'; content: string; }
interface PricingResult {
  estimated_price: string; resale_price: string; quick_sale_price: string;
  confidence: string; reason: string;
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: '高 ✅', medium: '中 ⚠️', low: '低 ❓',
};

function extractVideoFrame(file: File): Promise<{ base64: string; preview: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = url;

    const capture = () => {
      try {
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 480;
        const maxW = 1280;
        const scale = Math.min(1, maxW / w);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        URL.revokeObjectURL(url);
        resolve({ base64: dataUrl.split(',')[1], preview: dataUrl });
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };

    video.onloadeddata = () => {
      if (video.duration > 0.5) {
        video.onseeked = capture;
        video.currentTime = Math.min(1, video.duration * 0.1);
      } else {
        capture();
      }
    };

    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('视频加载失败')); };
    setTimeout(() => { URL.revokeObjectURL(url); reject(new Error('视频处理超时')); }, 15000);
  });
}

async function parseSpreadsheet(file: File): Promise<{ text: string; rows: string[][] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target!.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];
        const text = allRows.slice(0, 100).map(r => (r as unknown[]).map(String).join(' | ')).join('\n');
        resolve({ text, rows: allRows.slice(0, 6).map(r => (r as unknown[]).map(String)) });
      } catch (e) { reject(e); }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [fileType, setFileType] = useState<FileType>('image');
  const [imageBase64, setImageBase64] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [spreadsheetText, setSpreadsheetText] = useState('');
  const [spreadsheetRows, setSpreadsheetRows] = useState<string[][]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (phase === 'chatting' && !loading) inputRef.current?.focus();
  }, [phase, loading, messages]);

  function reset() {
    setPhase('upload');
    setFileType('image');
    setImageBase64('');
    setImagePreview('');
    setSpreadsheetText('');
    setSpreadsheetRows([]);
    setProduct(null);
    setMessages([]);
    setUserInput('');
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setImageBase64('');
    setImagePreview('');
    setSpreadsheetText('');
    setSpreadsheetRows([]);

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    const isSpreadsheet = /\.(xlsx?|csv)$/i.test(file.name) ||
      file.type.includes('spreadsheet') || file.type === 'text/csv';

    if (isImage) {
      if (file.size > 10 * 1024 * 1024) { setError('图片不能超过 10MB'); return; }
      setFileType('image');
      const reader = new FileReader();
      reader.onload = ev => {
        const dataUrl = ev.target?.result as string;
        setImagePreview(dataUrl);
        setImageBase64(dataUrl.split(',')[1]);
      };
      reader.readAsDataURL(file);
    } else if (isVideo) {
      setFileType('video');
      setLoading(true);
      try {
        const { base64, preview } = await extractVideoFrame(file);
        setImageBase64(base64);
        setImagePreview(preview);
      } catch {
        setError('视频帧提取失败，请尝试其他视频文件');
      } finally {
        setLoading(false);
      }
    } else if (isSpreadsheet) {
      if (file.size > 20 * 1024 * 1024) { setError('表格文件不能超过 20MB'); return; }
      setFileType('spreadsheet');
      setLoading(true);
      try {
        const { text, rows } = await parseSpreadsheet(file);
        setSpreadsheetText(text);
        setSpreadsheetRows(rows);
      } catch {
        setError('表格解析失败，请检查文件格式');
      } finally {
        setLoading(false);
      }
    } else {
      setError('不支持的文件格式，请上传图片、视频或表格');
    }
  }

  const hasFile = !!(imageBase64 || spreadsheetText);
  const showSidebar = !!imagePreview;

  async function handleStartValuation() {
    if (!hasFile || loading) return;
    setLoading(true);
    setError('');

    try {
      const idBody = fileType === 'spreadsheet'
        ? { text: spreadsheetText }
        : { image: imageBase64 };

      const idRes = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idBody),
      });
      if (!idRes.ok) throw new Error(`识别失败 (${idRes.status})`);
      const identified: Product = await idRes.json();
      setProduct(identified);

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
    <div className="min-h-screen bg-[#f0f2f7]">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f172a] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-base shadow-md">
              📦
            </div>
            <span className="text-white font-bold text-base sm:text-lg tracking-tight">
              Inventory Liquidity <span className="text-violet-400">AI</span>
            </span>
          </div>
          {phase !== 'upload' && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
            >
              <span>↺</span> New Appraisal
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Phase: upload */}
        {phase === 'upload' && (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] leading-tight">
                Get Instant Valuation
              </h2>
              <p className="text-slate-500 mt-2 text-sm sm:text-base">
                Upload a photo, video, or spreadsheet — AI identifies your product and guides you to the best price.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Drop zone */}
              <div
                onClick={() => !loading && fileInputRef.current?.click()}
                className={`relative transition-all duration-200 ${
                  hasFile
                    ? 'bg-slate-50 cursor-pointer'
                    : loading
                    ? 'cursor-wait'
                    : 'bg-gradient-to-b from-slate-50 to-white hover:from-violet-50/60 hover:to-white cursor-pointer'
                }`}
              >
                {imagePreview ? (
                  <div className="p-4">
                    <div className="relative inline-block w-full">
                      <img src={imagePreview} alt="Preview" className="mx-auto max-h-72 rounded-xl object-contain" />
                      {fileType === 'video' && (
                        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          Video frame
                        </div>
                      )}
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-3">Click to change file</p>
                  </div>
                ) : spreadsheetRows.length > 0 ? (
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-700">
                        Spreadsheet loaded — {spreadsheetRows.length} rows preview
                      </p>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="text-xs w-full">
                        <tbody>
                          {spreadsheetRows.map((row, i) => (
                            <tr key={i} className={i === 0 ? 'bg-slate-100 font-semibold' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                              {row.slice(0, 6).map((cell, j) => (
                                <td key={j} className="px-2 py-1.5 border-r border-slate-200 last:border-r-0 text-slate-600 max-w-[120px] truncate">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-3">Click to change file</p>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center justify-center py-14 px-6">
                    <svg className="animate-spin h-8 w-8 text-violet-500 mb-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <p className="text-sm text-slate-500">Processing file...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-14 px-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 flex items-center justify-center mb-4 shadow-inner">
                      <svg className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <p className="text-base font-semibold text-slate-700">Drop your file here</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-slate-400">📷 Images</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">🎬 Videos</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-400">📊 Spreadsheets</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG, MP4, MOV, XLSX, CSV · max 10 MB</p>
                  </div>
                )}
                {!hasFile && !loading && (
                  <div className="absolute inset-3 rounded-xl border-2 border-dashed border-slate-200 pointer-events-none" />
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.csv,.xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="p-5 border-t border-slate-100 space-y-3">
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                    <span>⚠️</span> {error}
                  </div>
                )}
                <button
                  onClick={handleStartValuation}
                  disabled={!hasFile || loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm sm:text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Start Valuation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase: chatting */}
        {phase === 'chatting' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Sidebar */}
            {showSidebar && product && (
              <div className="hidden lg:block lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-20">
                  <div className="relative">
                    <img src={imagePreview} alt={product.name} className="w-full aspect-square object-cover" />
                    {fileType === 'video' && (
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        Video
                      </div>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Product</p>
                      <p className="text-sm font-bold text-slate-800">{product.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{product.category}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Brand</p>
                      <p className="text-sm font-medium text-slate-700">{product.brand}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                      <p className="text-xs text-slate-500">AI Appraisal in progress</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chat panel */}
            <div className={`${showSidebar ? 'lg:col-span-2' : 'lg:col-span-3'} w-full`}>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[580px] sm:h-[640px]">
                {/* Mobile top bar */}
                {product && (
                  <div className="flex lg:hidden items-center gap-3 px-4 py-3 border-b border-slate-100 bg-[#0f172a] rounded-t-2xl">
                    {imagePreview && (
                      <img src={imagePreview} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                      <p className="text-xs text-slate-400">{product.brand} · {product.category}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-xs text-slate-400">Analyzing</span>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                  {messages
                    .filter(m => m.role === 'assistant' || (m.role === 'user' && !m.content.startsWith('商品信息：')))
                    .map((msg, i) => (
                      <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs flex-shrink-0 mb-0.5">
                            🤖
                          </div>
                        )}
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#0f172a] text-white rounded-br-sm'
                            : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  {loading && (
                    <div className="flex items-end gap-2 justify-start">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs flex-shrink-0">
                        🤖
                      </div>
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

                {/* Input bar */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl space-y-2">
                  {error && <p className="text-xs text-red-500 px-1">⚠️ {error}</p>}
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={userInput}
                      onChange={e => setUserInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendAnswer()}
                      placeholder="Type your answer..."
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendAnswer}
                      disabled={!userInput.trim() || loading}
                      className="px-4 py-2.5 bg-[#0f172a] hover:bg-slate-700 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                      <span className="hidden sm:inline">Send</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase: done */}
        {phase === 'done' && result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Sidebar */}
            {showSidebar && (
              <div className="hidden lg:block lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-20">
                  <div className="relative">
                    <img src={imagePreview} alt={product?.name} className="w-full aspect-square object-cover" />
                    {fileType === 'video' && (
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        Video
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-bold text-slate-800">{product?.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{product?.brand} · {product?.category}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            <div className={`${showSidebar ? 'lg:col-span-2' : 'lg:col-span-3'} w-full space-y-4`}>
              <div className="bg-[#0f172a] rounded-2xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg">
                  ✅
                </div>
                <div>
                  <p className="text-white font-bold text-lg">Appraisal Complete</p>
                  {product && <p className="text-slate-400 text-sm mt-0.5">{product.name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <PriceCard label="Purchase Price" value={result.estimated_price} accent="violet" />
                <PriceCard label="Resale Price" value={result.resale_price} accent="indigo" />
                <PriceCard label="Quick Sale" value={result.quick_sale_price} accent="slate" />
                <PriceCard label="Confidence" value={CONFIDENCE_LABEL[result.confidence] ?? result.confidence} accent="slate" />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">AI Analysis</p>
                <p className="text-sm text-slate-700 leading-relaxed">{result.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={reset}
                  className="py-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-sm font-semibold transition-all"
                >
                  ↺ New Appraisal
                </button>
                <button
                  onClick={() => {
                    const text = `Product: ${product?.name}\nPurchase Price: ${result.estimated_price}\nResale Price: ${result.resale_price}\nQuick Sale: ${result.quick_sale_price}\nConfidence: ${result.confidence}`;
                    navigator.clipboard.writeText(text);
                  }}
                  className="py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-sm font-semibold transition-all shadow-md"
                >
                  Copy Results
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function PriceCard({ label, value, accent }: {
  label: string;
  value: string;
  accent: 'violet' | 'indigo' | 'slate';
}) {
  const styles = {
    violet: 'bg-gradient-to-br from-violet-600 to-violet-700 text-white',
    indigo: 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white',
    slate:  'bg-white border border-slate-200 text-slate-800',
  };
  const labelColor = accent === 'slate' ? 'text-slate-400' : 'text-white/70';
  const valueColor = accent === 'slate' ? 'text-slate-900' : 'text-white';

  return (
    <div className={`rounded-2xl p-4 sm:p-5 shadow-sm ${styles[accent]}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${labelColor}`}>{label}</p>
      <p className={`text-xl sm:text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}
