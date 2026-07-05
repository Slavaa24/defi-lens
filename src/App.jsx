import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import Calculator from './pages/Calculator'
import Pools from './pages/Pools'
import Portfolio from './pages/Portfolio'
import Dashboard from './pages/Dashboard'
import Pricing from './pages/Pricing'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import NotFound from './pages/NotFound'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/pools" element={<Pools />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
