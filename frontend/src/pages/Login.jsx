import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { checkAuth } = useAuth()

  useEffect(() => {
    const error = searchParams.get('error')
    const description = searchParams.get('description') || searchParams.get('message')
    
    if (error) {
      let errorMessage = `Login error: ${error}`
      if (description) {
        errorMessage += `\n\nDetails: ${description}`
      }
      
      // Provide helpful messages for common errors
      if (error === 'access_denied') {
        errorMessage = 'Access was denied. Please authorize the app when prompted on Airtable.'
      } else if (error === 'token_exchange_failed') {
        errorMessage = `Token exchange failed: ${description || 'Please check your OAuth credentials.'}`
      } else if (error === 'invalid_client') {
        errorMessage = 'Invalid OAuth credentials. Please check your Client ID and Client Secret in the backend .env file.'
      } else if (error === 'no_code') {
        errorMessage = 'No authorization code received. Please try logging in again.'
      }
      
      alert(errorMessage)
    }
  }, [searchParams])

  const handleLogin = () => {
    window.location.href = '/api/auth/airtable'
  }

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '100px' }}>
      <div className="card">
        <h1 style={{ marginBottom: '20px', textAlign: 'center' }}>BustBrain</h1>
        <p style={{ marginBottom: '20px', textAlign: 'center', color: '#666' }}>
          Form Builder with Airtable Integration
        </p>
        <button className="btn btn-primary" onClick={handleLogin} style={{ width: '100%' }}>
          Login with Airtable
        </button>
      </div>
    </div>
  )
}

export default Login

