import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import useDocumentTitle from '../hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Page not found')
  return (
    <div className="max-w-xl mx-auto pt-12">
      <EmptyState
        icon="🧭"
        title="Page not found"
        message="This page doesn’t exist — maybe it drifted out of range."
        action={
          <Link to="/" className="btn-primary">
            Back home
          </Link>
        }
      />
    </div>
  )
}
