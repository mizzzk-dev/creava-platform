import { AppRoutes } from '@/lib/routes'
import ErrorBoundary from '@/components/common/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  )
}

export default App
