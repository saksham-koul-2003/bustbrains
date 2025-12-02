import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FormBuilder from './pages/FormBuilder'
import FormViewer from './pages/FormViewer'
import ResponsesList from './pages/ResponsesList'
import { AuthProvider, useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/new"
        element={
          <ProtectedRoute>
            <FormBuilder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:formId/edit"
        element={
          <ProtectedRoute>
            <FormBuilder />
          </ProtectedRoute>
        }
      />
      <Route path="/form/:formId" element={<FormViewer />} />
      <Route
        path="/forms/:formId/responses"
        element={
          <ProtectedRoute>
            <ResponsesList />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App

