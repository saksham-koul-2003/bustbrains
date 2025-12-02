import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

function ResponsesList() {
  const { formId } = useParams()
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(null)

  useEffect(() => {
    fetchData()
  }, [formId])

  const fetchData = async () => {
    try {
      const [formResponse, responsesResponse] = await Promise.all([
        axios.get(`/api/forms/${formId}`, { withCredentials: true }),
        axios.get(`/api/responses/${formId}`, { withCredentials: true })
      ])
      setForm(formResponse.data.form)
      setResponses(responsesResponse.data.responses)
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load responses')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '20px' }}>
        <Link to="/dashboard" className="btn btn-secondary" style={{ marginRight: '10px' }}>
          ← Back to Dashboard
        </Link>
        <Link to={`/form/${formId}`} className="btn btn-primary">
          View Form
        </Link>
      </div>

      <div className="card">
        <h1>Responses for: {form?.title}</h1>
        {responses.length === 0 ? (
          <p>No responses yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Created</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Answers Preview</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((response) => (
                <tr key={response.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', fontFamily: 'monospace', fontSize: '12px' }}>
                    {response.id.substring(0, 8)}...
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor:
                          response.status === 'active' ? '#28a745' : '#dc3545',
                        color: 'white',
                        fontSize: '12px'
                      }}
                    >
                      {response.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px', color: '#666' }}>
                    {new Date(response.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px', fontSize: '12px' }}>
                    {Object.keys(response.answersPreview).length > 0 ? (
                      <div>
                        {Object.entries(response.answersPreview).map(([key, value]) => (
                          <div key={key}>
                            <strong>{key}:</strong> {String(value)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: '#999' }}>No preview</span>
                    )}
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

export default ResponsesList

