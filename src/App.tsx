import MarketingCommandCenter from './MarketingCommandCenter'
import { ErrorBoundary } from './components/ErrorBoundary'
import PasswordGate from './components/PasswordGate'

function App() {
  return (
    <ErrorBoundary>
      <PasswordGate>
        <MarketingCommandCenter />
      </PasswordGate>
    </ErrorBoundary>
  )
}

export default App
