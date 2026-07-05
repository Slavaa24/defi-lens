const tones = {
  neutral: 'text-txt-primary',
  positive: 'text-positive',
  negative: 'text-negative',
  warning: 'text-warning',
}

export default function StatCard({ label, value, sub, tone = 'neutral', title }) {
  return (
    <div className="card p-5" title={title}>
      <p className="text-[11px] uppercase tracking-wider text-txt-secondary mb-2">{label}</p>
      <p className={`text-2xl font-bold ${tones[tone] || tones.neutral}`}>{value}</p>
      {sub && <p className="text-xs text-txt-secondary mt-1">{sub}</p>}
    </div>
  )
}
