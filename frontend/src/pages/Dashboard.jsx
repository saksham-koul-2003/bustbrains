import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function Dashboard() {
  const { user, logout } = useAuth()
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      const response = await axios.get('/api/forms', {
        withCredentials: true
      })
      setForms(response.data.forms)
    } catch (error) {
      console.error('Error fetching forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (formId) => {
    if (!window.confirm('Are you sure you want to delete this form?')) {
      return
    }

    try {
      await axios.delete(`/api/forms/${formId}`, {
        withCredentials: true
      })
      fetchForms()
    } catch (error) {
      console.error('Error deleting form:', error)
      alert('Failed to delete form')
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Dashboard</h1>
        <div>
          <span style={{ marginRight: '15px' }}>Welcome, {user?.name || user?.email}</span>
          <Link to="/forms/new" className="btn btn-primary" style={{ marginRight: '10px' }}>
            Create New Form
          </Link>
          <button className="btn btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Your Forms</h2>
        {forms.length === 0 ? (
          <p>No forms yet. Create your first form!</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Title</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => (
                <tr key={form._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>
                    <Link to={`/form/${form._id}`} style={{ textDecoration: 'none', color: '#007bff' }}>
                      {form.title}
                    </Link>
                  </td>
                  <td style={{ padding: '10px', color: '#666' }}>
                    {new Date(form.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <Link
                      to={`/form/${form._id}`}
                      className="btn btn-primary"
                      style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    >
                      View
                    </Link>
                    <Link
                      to={`/forms/${form._id}/responses`}
                      className="btn btn-secondary"
                      style={{ marginRight: '5px', padding: '5px 10px', fontSize: '12px' }}
                    >
                      Responses
                    </Link>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(form._id)}
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Dashboard

