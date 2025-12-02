import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

function FormBuilder() {
  const { formId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [bases, setBases] = useState([])
  const [tables, setTables] = useState([])
  const [fields, setFields] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    airtableBaseId: '',
    airtableTableId: '',
    questions: []
  })

  useEffect(() => {
    if (formId) {
      fetchForm()
    } else {
      fetchBases()
    }
  }, [formId])

  const fetchForm = async () => {
    try {
      const response = await axios.get(`/api/forms/${formId}`, {
        withCredentials: true
      })
      const form = response.data.form
      setFormData({
        title: form.title,
        airtableBaseId: form.airtableBaseId,
        airtableTableId: form.airtableTableId,
        questions: form.questions
      })
      fetchBases()
    } catch (error) {
      console.error('Error fetching form:', error)
    }
  }

  const fetchBases = async () => {
    try {
      const response = await axios.get('/api/forms/bases', {
        withCredentials: true
      })
      setBases(response.data.bases)
    } catch (error) {
      console.error('Error fetching bases:', error)
      alert('Failed to fetch Airtable bases')
    }
  }

  const handleBaseSelect = async (baseId) => {
    setFormData({ ...formData, airtableBaseId: baseId, airtableTableId: '' })
    setTables([])
    setFields([])
    try {
      const response = await axios.get(`/api/forms/bases/${baseId}/tables`, {
        withCredentials: true
      })
      setTables(response.data.tables)
    } catch (error) {
      console.error('Error fetching tables:', error)
      alert('Failed to fetch tables')
    }
  }

  const handleTableSelect = async (tableId) => {
    setFormData({ ...formData, airtableTableId: tableId })
    setFields([])
    try {
      const response = await axios.get(
        `/api/forms/bases/${formData.airtableBaseId}/tables/${tableId}/fields`,
        { withCredentials: true }
      )
      setFields(response.data.fields)
    } catch (error) {
      console.error('Error fetching fields:', error)
      alert('Failed to fetch fields')
    }
  }

  const handleFieldToggle = (field) => {
    const existingIndex = formData.questions.findIndex(
      q => q.airtableFieldId === field.id
    )

    if (existingIndex >= 0) {
      // Remove field
      const newQuestions = formData.questions.filter(
        q => q.airtableFieldId !== field.id
      )
      setFormData({ ...formData, questions: newQuestions })
    } else {
      // Add field
      const questionKey = field.name.toLowerCase().replace(/\s+/g, '_')
      const newQuestion = {
        questionKey,
        airtableFieldId: field.id,
        label: field.name,
        type: field.type,
        required: false,
        conditionalRules: null,
        options: field.options || []
      }
      setFormData({
        ...formData,
        questions: [...formData.questions, newQuestion]
      })
    }
  }

  const handleQuestionUpdate = (index, updates) => {
    const newQuestions = [...formData.questions]
    newQuestions[index] = { ...newQuestions[index], ...updates }
    setFormData({ ...formData, questions: newQuestions })
  }

  const handleAddCondition = (questionIndex) => {
    const question = formData.questions[questionIndex]
    const newCondition = {
      questionKey: formData.questions[0]?.questionKey || '',
      operator: 'equals',
      value: ''
    }
    const newRules = {
      logic: 'AND',
      conditions: question.conditionalRules
        ? [...question.conditionalRules.conditions, newCondition]
        : [newCondition]
    }
    handleQuestionUpdate(questionIndex, { conditionalRules: newRules })
  }

  const handleRemoveCondition = (questionIndex, conditionIndex) => {
    const question = formData.questions[questionIndex]
    const newConditions = question.conditionalRules.conditions.filter(
      (_, i) => i !== conditionIndex
    )
    const newRules =
      newConditions.length > 0
        ? { ...question.conditionalRules, conditions: newConditions }
        : null
    handleQuestionUpdate(questionIndex, { conditionalRules: newRules })
  }

  const handleConditionUpdate = (questionIndex, conditionIndex, updates) => {
    const question = formData.questions[questionIndex]
    const newConditions = [...question.conditionalRules.conditions]
    newConditions[conditionIndex] = {
      ...newConditions[conditionIndex],
      ...updates
    }
    handleQuestionUpdate(questionIndex, {
      conditionalRules: { ...question.conditionalRules, conditions: newConditions }
    })
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.airtableBaseId || !formData.airtableTableId) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.questions.length === 0) {
      alert('Please select at least one field')
      return
    }

    setLoading(true)
    try {
      if (formId) {
        await axios.put(`/api/forms/${formId}`, formData, {
          withCredentials: true
        })
      } else {
        await axios.post('/api/forms', formData, {
          withCredentials: true
        })
      }
      navigate('/dashboard')
    } catch (error) {
      console.error('Error saving form:', error)
      alert('Failed to save form')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>{formId ? 'Edit Form' : 'Create New Form'}</h1>

      {step === 1 && (
        <div className="card">
          <h2>Step 1: Basic Information</h2>
          <div className="form-group">
            <label>Form Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="My Form"
            />
          </div>
          <div className="form-group">
            <label>Select Airtable Base *</label>
            <select
              value={formData.airtableBaseId}
              onChange={(e) => handleBaseSelect(e.target.value)}
            >
              <option value="">-- Select Base --</option>
              {bases.map((base) => (
                <option key={base.id} value={base.id}>
                  {base.name}
                </option>
              ))}
            </select>
          </div>
          {formData.airtableBaseId && (
            <div className="form-group">
              <label>Select Table *</label>
              <select
                value={formData.airtableTableId}
                onChange={(e) => handleTableSelect(e.target.value)}
              >
                <option value="">-- Select Table --</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {formData.airtableTableId && (
            <button
              className="btn btn-primary"
              onClick={() => setStep(2)}
            >
              Next: Select Fields
            </button>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h2>Step 2: Select Fields</h2>
          {fields.length === 0 ? (
            <p>No supported fields found in this table.</p>
          ) : (
            <div>
              {fields.map((field) => {
                const isSelected = formData.questions.some(
                  q => q.airtableFieldId === field.id
                )
                return (
                  <div
                    key={field.id}
                    style={{
                      padding: '10px',
                      marginBottom: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: isSelected ? '#e7f3ff' : 'white'
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleFieldToggle(field)}
                        style={{ marginRight: '10px' }}
                      />
                      <div>
                        <strong>{field.name}</strong> ({field.type})
                        {field.options.length > 0 && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                            Options: {field.options.join(', ')}
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ marginTop: '20px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setStep(1)}
              style={{ marginRight: '10px' }}
            >
              Back
            </button>
            {formData.questions.length > 0 && (
              <button
                className="btn btn-primary"
                onClick={() => setStep(3)}
              >
                Next: Configure Questions
              </button>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h2>Step 3: Configure Questions</h2>
          {formData.questions.map((question, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #ddd',
                padding: '15px',
                marginBottom: '15px',
                borderRadius: '4px'
              }}
            >
              <div className="form-group">
                <label>Question Label</label>
                <input
                  type="text"
                  value={question.label}
                  onChange={(e) =>
                    handleQuestionUpdate(index, { label: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) =>
                      handleQuestionUpdate(index, { required: e.target.checked })
                    }
                  />
                  Required
                </label>
              </div>

              <div style={{ marginTop: '15px' }}>
                <strong>Conditional Logic</strong>
                {question.conditionalRules && (
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5' }}>
                    <div className="form-group">
                      <label>Logic Operator</label>
                      <select
                        value={question.conditionalRules.logic}
                        onChange={(e) =>
                          handleQuestionUpdate(index, {
                            conditionalRules: {
                              ...question.conditionalRules,
                              logic: e.target.value
                            }
                          })
                        }
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    </div>
                    {question.conditionalRules.conditions.map((condition, condIndex) => (
                      <div
                        key={condIndex}
                        style={{
                          border: '1px solid #ddd',
                          padding: '10px',
                          marginBottom: '10px',
                          backgroundColor: 'white'
                        }}
                      >
                        <div className="form-group">
                          <label>Show if this question:</label>
                          <select
                            value={condition.questionKey}
                            onChange={(e) =>
                              handleConditionUpdate(index, condIndex, {
                                questionKey: e.target.value
                              })
                            }
                          >
                            {formData.questions
                              .filter((q, i) => i !== index)
                              .map((q) => (
                                <option key={q.questionKey} value={q.questionKey}>
                                  {q.label}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Operator</label>
                          <select
                            value={condition.operator}
                            onChange={(e) =>
                              handleConditionUpdate(index, condIndex, {
                                operator: e.target.value
                              })
                            }
                          >
                            <option value="equals">equals</option>
                            <option value="notEquals">not equals</option>
                            <option value="contains">contains</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Value</label>
                          <input
                            type="text"
                            value={condition.value}
                            onChange={(e) =>
                              handleConditionUpdate(index, condIndex, {
                                value: e.target.value
                              })
                            }
                          />
                        </div>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleRemoveCondition(index, condIndex)}
                          style={{ padding: '5px 10px', fontSize: '12px' }}
                        >
                          Remove Condition
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-primary"
                      onClick={() => handleAddCondition(index)}
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                    >
                      Add Condition
                    </button>
                  </div>
                )}
                {!question.conditionalRules && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleAddCondition(index)}
                    style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px' }}
                  >
                    Add Conditional Logic
                  </button>
                )}
              </div>
            </div>
          ))}
          <div style={{ marginTop: '20px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setStep(2)}
              style={{ marginRight: '10px' }}
            >
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : formId ? 'Update Form' : 'Create Form'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormBuilder

