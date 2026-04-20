export function parseJson(text: string): Record<string, unknown> | null {
  try { return JSON.parse(text.trim()) as Record<string, unknown>; } catch { /* */ }
  const stripped = text.replace(/```(?:json)?/gi, '').trim();
  try { return JSON.parse(stripped) as Record<string, unknown>; } catch { /* */ }
  let depth = 0, start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') { if (depth === 0) start = i; depth++; }
    else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try { return JSON.parse(text.slice(start, i + 1)) as Record<string, unknown>; } catch { start = -1; }
      }
    }
  }
  return null;
}

export function findByKeywords(obj: Record<string, string>, kws: string[]): string {
  for (const kw of kws) {
    const found = Object.entries(obj).find(([k]) =>
      k.toLowerCase().includes(kw.toLowerCase())
    );
    if (found) return found[1];
  }
  return '';
}
