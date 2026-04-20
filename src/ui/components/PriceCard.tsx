interface PriceCardProps {
  label: string;
  value: string;
  accent: 'violet' | 'indigo' | 'slate';
}

const styles = {
  violet: 'bg-gradient-to-br from-violet-600 to-violet-700 text-white',
  indigo: 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white',
  slate:  'bg-white border border-slate-200 text-slate-800',
} as const;

export function PriceCard({ label, value, accent }: PriceCardProps) {
  return (
    <div className={`rounded-2xl p-4 sm:p-5 shadow-sm ${styles[accent]}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${accent === 'slate' ? 'text-slate-400' : 'text-white/70'}`}>
        {label}
      </p>
      <p className={`text-xl sm:text-2xl font-bold ${accent === 'slate' ? 'text-slate-900' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
