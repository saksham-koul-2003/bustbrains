import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { shouldShowQuestion } from '../utils/conditionalLogic'

function FormViewer() {
  const { formId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    fetchForm()
  }, [formId])

  const fetchForm = async () => {
    try {
      const response = await axios.get(`/api/forms/${formId}`)
      setForm(response.data.form)
    } catch (error) {
      console.error('Error fetching form:', error)
      alert('Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionKey, value) => {
    setAnswers({ ...answers, [questionKey]: value })
    setErrors([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors([])

    // Validate required fields
    const validationErrors = []
    form.questions.forEach((question) => {
      const shouldShow = shouldShowQuestion(question.conditionalRules, answers)
      if (shouldShow && question.required) {
        const answer = answers[question.questionKey]
        if (answer === undefined || answer === null || answer === '') {
          validationErrors.push(`${question.label} is required`)
        }
      }
    })

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    try {
      await axios.post(`/api/responses/${formId}`, { answers })
      alert('Form submitted successfully!')
      setAnswers({})
    } catch (error) {
      console.error('Error submitting form:', error)
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      } else {
        alert('Failed to submit form')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading form...</div>
  }

  if (!form) {
    return <div className="container">Form not found</div>
  }

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="card">
        <h1>{form.title}</h1>
        <form onSubmit={handleSubmit}>
          {form.questions.map((question, index) => {
            const shouldShow = shouldShowQuestion(question.conditionalRules, answers)
            if (!shouldShow) {
              return null
            }

            return (
              <div key={index} className="form-group">
                <label>
                  {question.label}
                  {question.required && <span style={{ color: 'red' }}> *</span>}
                </label>
                {question.type === 'singleLineText' && (
                  <input
                    type="text"
                    value={answers[question.questionKey] || ''}
                    onChange={(e) =>
                      handleAnswerChange(question.questionKey, e.target.value)
                    }
                  />
                )}
                {question.type === 'multilineText' && (
                  <textarea
                    value={answers[question.questionKey] || ''}
                    onChange={(e) =>
                      handleAnswerChange(question.questionKey, e.target.value)
                    }
                  />
                )}
                {question.type === 'singleSelect' && (
                  <select
                    value={answers[question.questionKey] || ''}
                    onChange={(e) =>
                      handleAnswerChange(question.questionKey, e.target.value)
                    }
                  >
                    <option value="">-- Select --</option>
                    {question.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
                {question.type === 'multipleSelects' && (
                  <div>
                    {question.options.map((option) => (
                      <label
                        key={option}
                        style={{ display: 'block', marginBottom: '5px' }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            (answers[question.questionKey] || []).includes(option)
                          }
                          onChange={(e) => {
                            const current = answers[question.questionKey] || []
                            const updated = e.target.checked
                              ? [...current, option]
                              : current.filter((v) => v !== option)
                            handleAnswerChange(question.questionKey, updated)
                          }}
                          style={{ marginRight: '5px' }}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                )}
                {question.type === 'multipleAttachments' && (
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      // For file uploads, we'd need to handle file upload to a service
                      // For now, just store file names
                      const files = Array.from(e.target.files).map(f => f.name)
                      handleAnswerChange(question.questionKey, files)
                    }}
                  />
                )}
              </div>
            )
          })}

          {errors.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              {errors.map((error, index) => (
                <div key={index} className="error">
                  {error}
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default FormViewer

