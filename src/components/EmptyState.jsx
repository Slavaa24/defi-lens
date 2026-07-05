export default function EmptyState({ icon = '🔍', title, message, action }) {
  return (
    <div className="card p-10 text-center">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      {message && <p className="text-sm text-txt-secondary mb-4">{message}</p>}
      {action}
    </div>
  )
}
