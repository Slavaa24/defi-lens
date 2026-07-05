export default function ErrorState({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="card p-10 text-center">
      <div className="text-3xl mb-3">⚠️</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      {message && <p className="text-sm text-txt-secondary mb-4">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          Try again
        </button>
      )}
    </div>
  )
}
