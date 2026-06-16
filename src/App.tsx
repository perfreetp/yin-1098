import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Queue from './pages/Queue'
import Broadcast from './pages/Broadcast'
import Events from './pages/Events'
import Review from './pages/Review'
import Settings from './pages/Settings'
import { useDispatchStore } from './store/dispatchStore'

function App() {
  const [route, setRoute] = useState<string>('dashboard')
  const { initSimulation, initialized } = useDispatchStore()

  useEffect(() => {
    const hash = window.location.hash.replace('#/', '') || 'dashboard'
    setRoute(hash)
    if (!initialized) {
      initSimulation()
    }
  }, [initialized])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '') || 'dashboard'
      setRoute(hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const renderPage = () => {
    switch (route) {
      case 'dashboard': return <Dashboard />
      case 'queue': return <Queue />
      case 'broadcast': return <Broadcast />
      case 'events': return <Events />
      case 'review': return <Review />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="app-container">
      {renderPage()}
    </div>
  )
}

export default App
