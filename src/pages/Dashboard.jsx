import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'

// Pro dashboard ships in Phase 2 (SIWE auth + position tracking).
export default function Dashboard() {
  return (
    <div className="max-w-2xl mx-auto pt-8">
      <EmptyState
        icon="🔒"
        title="The Pro dashboard is almost here"
        message="Multi-wallet Uniswap v3 position tracking with real-time IL, fee earnings and Telegram alerts is coming in the next release. Meanwhile, the calculator, pools explorer and portfolio snapshots are free."
        action={
          <div className="flex justify-center gap-3">
            <Link to="/pricing" className="btn-primary">
              See what Pro includes
            </Link>
            <Link to="/portfolio" className="btn-secondary">
              Try a portfolio snapshot
            </Link>
          </div>
        }
      />
    </div>
  )
}
