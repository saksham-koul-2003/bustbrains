import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Form from '../models/Form.js';
import { getAirtableClient, mapAirtableFieldType, SUPPORTED_FIELD_TYPES } from '../utils/airtableClient.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Get user's Airtable bases
router.get('/bases', async (req, res) => {
  try {
    const client = getAirtableClient(req.user.accessToken);
    const response = await client.get('/meta/bases');
    
    res.json({ bases: response.data.bases });
  } catch (error) {
    console.error('Get bases error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch bases' });
  }
});

// Get tables from a base
router.get('/bases/:baseId/tables', async (req, res) => {
  try {
    const { baseId } = req.params;
    const client = getAirtableClient(req.user.accessToken);
    const response = await client.get(`/meta/bases/${baseId}/tables`);
    
    res.json({ tables: response.data.tables });
  } catch (error) {
    console.error('Get tables error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Get fields from a table
router.get('/bases/:baseId/tables/:tableId/fields', async (req, res) => {
  try {
    const { baseId, tableId } = req.params;
    const client = getAirtableClient(req.user.accessToken);
    const response = await client.get(`/meta/bases/${baseId}/tables/${tableId}`);
    
    const fields = response.data.fields
      .filter(field => SUPPORTED_FIELD_TYPES.includes(field.type))
      .map(field => ({
        id: field.id,
        name: field.name,
        type: field.type,
        options: field.options?.choices?.map(c => c.name) || []
      }));
    
    res.json({ fields });
  } catch (error) {
    console.error('Get fields error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

// Create a new form
router.post('/', async (req, res) => {
  try {
    const { title, airtableBaseId, airtableTableId, questions } = req.body;

    if (!title || !airtableBaseId || !airtableTableId || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate questions structure
    for (const question of questions) {
      if (!question.questionKey || !question.airtableFieldId || !question.label || !question.type) {
        return res.status(400).json({ error: 'Invalid question structure' });
      }

      // Validate type is supported
      if (!SUPPORTED_FIELD_TYPES.includes(question.type)) {
        return res.status(400).json({ error: `Unsupported field type: ${question.type}` });
      }
    }

    const form = await Form.create({
      owner: req.user._id,
      title,
      airtableBaseId,
      airtableTableId,
      questions
    });

    res.status(201).json({ form });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Get all forms for the user
router.get('/', async (req, res) => {
  try {
    const forms = await Form.find({ owner: req.user._id })
      .select('-questions')
      .sort({ createdAt: -1 });
    
    res.json({ forms });
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Get a single form by ID
router.get('/:formId', async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Check if user owns the form (or allow public access for viewing)
    // For now, we'll allow viewing any form
    res.json({ form });
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// Update a form
router.put('/:formId', async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this form' });
    }

    const { title, questions } = req.body;
    
    if (title) form.title = title;
    if (questions) {
      // Validate questions
      for (const question of questions) {
        if (!SUPPORTED_FIELD_TYPES.includes(question.type)) {
          return res.status(400).json({ error: `Unsupported field type: ${question.type}` });
        }
      }
      form.questions = questions;
    }

    await form.save();
    res.json({ form });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete a form
router.delete('/:formId', async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this form' });
    }

    await Form.deleteOne({ _id: form._id });
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

export default router;

