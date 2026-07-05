import { NavLink, Link } from 'react-router-dom'
import ConnectButton from './ConnectButton'

const navItems = [
  { to: '/calculator', label: 'Calculator' },
  { to: '/pools', label: 'Pools' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/dashboard', label: 'Dashboard' },
]

function NavTab({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `relative px-3 py-1.5 text-sm transition-colors whitespace-nowrap ${
          isActive ? 'text-txt-primary font-medium' : 'text-txt-secondary hover:text-txt-primary'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {label}
          {isActive && (
            <span className="absolute left-2 right-2 -bottom-[9px] h-[2px] rounded-full bg-gradient-to-r from-accent-from to-accent-to" />
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-edge bg-bg/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-[60px] flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <span className="text-lg">⚡</span>
            <span className="font-bold tracking-tight">DeFi Lens</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavTab key={item.to} {...item} />
            ))}
          </nav>
          <ConnectButton />
        </div>
        {/* mobile nav row */}
        <nav className="md:hidden flex items-center gap-1 pb-2 -mt-1 overflow-x-auto">
          {navItems.map((item) => (
            <NavTab key={item.to} {...item} />
          ))}
        </nav>
      </div>
    </header>
  )
}
