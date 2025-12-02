import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Response from '../models/Response.js';
import Form from '../models/Form.js';
import { getAirtableClient } from '../utils/airtableClient.js';
import { shouldShowQuestion } from '../utils/conditionalLogic.js';

const router = express.Router();

// Submit a form response
router.post('/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const { answers } = req.body;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Validate answers
    const validationErrors = [];
    const processedAnswers = {};

    for (const question of form.questions) {
      const answer = answers[question.questionKey];

      // Check if question should be shown (conditional logic)
      const shouldShow = shouldShowQuestion(question.conditionalRules, answers);
      if (!shouldShow) {
        continue; // Skip validation for hidden questions
      }

      // Check required fields
      if (question.required && (answer === undefined || answer === null || answer === '')) {
        validationErrors.push(`${question.label} is required`);
        continue;
      }

      // Validate answer type
      if (answer !== undefined && answer !== null && answer !== '') {
        switch (question.type) {
          case 'singleSelect':
            if (!question.options.includes(answer)) {
              validationErrors.push(`${question.label} has invalid option`);
            }
            break;
          case 'multipleSelects':
            if (!Array.isArray(answer)) {
              validationErrors.push(`${question.label} must be an array`);
            } else {
              const invalidOptions = answer.filter(opt => !question.options.includes(opt));
              if (invalidOptions.length > 0) {
                validationErrors.push(`${question.label} has invalid options`);
              }
            }
            break;
          case 'multipleAttachments':
            if (!Array.isArray(answer)) {
              validationErrors.push(`${question.label} must be an array of attachments`);
            }
            break;
        }

        processedAnswers[question.airtableFieldId] = answer;
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Get form owner's access token
    const formWithOwner = await Form.findById(formId).populate('owner');
    if (!formWithOwner || !formWithOwner.owner) {
      return res.status(404).json({ error: 'Form owner not found' });
    }

    // Save to Airtable
    const client = getAirtableClient(formWithOwner.owner.accessToken);
    const airtableResponse = await client.post(
      `/${formWithOwner.airtableBaseId}/${formWithOwner.airtableTableId}`,
      {
        records: [
          {
            fields: processedAnswers
          }
        ]
      }
    );

    // Airtable returns { records: [{ id, fields, createdTime }] }
    const airtableRecordId = airtableResponse.data.records[0].id;

    // Save to MongoDB
    const response = await Response.create({
      formId: form._id,
      airtableRecordId,
      answers: answers
    });

    res.status(201).json({ 
      response, 
      airtableRecord: airtableResponse.data.records[0] 
    });
  } catch (error) {
    console.error('Submit response error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Get all responses for a form
router.get('/:formId', requireAuth, async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Check if user owns the form
    if (form.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to view responses' });
    }

    const responses = await Response.find({ formId })
      .sort({ createdAt: -1 })
      .select('_id airtableRecordId answers status createdAt updatedAt');

    // Format responses for display
    const formattedResponses = responses.map(response => ({
      id: response._id,
      airtableRecordId: response.airtableRecordId,
      status: response.status,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      answersPreview: Object.keys(response.answers)
        .slice(0, 3)
        .reduce((acc, key) => {
          const value = response.answers[key];
          acc[key] = Array.isArray(value) 
            ? `${value.length} items` 
            : String(value).substring(0, 50);
          return acc;
        }, {})
    }));

    res.json({ responses: formattedResponses });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Get a single response
router.get('/:formId/:responseId', requireAuth, async (req, res) => {
  try {
    const { formId, responseId } = req.params;

    const form = await Form.findById(formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const response = await Response.findById(responseId);
    if (!response || response.formId.toString() !== formId) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.json({ response });
  } catch (error) {
    console.error('Get response error:', error);
    res.status(500).json({ error: 'Failed to fetch response' });
  }
});

export default router;

