import express from 'express';
import Response from '../models/Response.js';

const router = express.Router();

// Airtable webhook endpoint
router.post('/airtable', async (req, res) => {
  try {
    // Verify webhook secret if configured
    // Check both header (for Zapier/Make.com) and body (for direct Airtable)
    const webhookSecret = req.headers['x-airtable-webhook-secret'] || req.body.webhookSecret;
    if (process.env.WEBHOOK_SECRET && webhookSecret && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Invalid webhook secret' });
    }
    
    // If WEBHOOK_SECRET is set but no secret provided, still allow (for development)
    // In production, you might want to require it or use Airtable's signature verification

    const { eventType, base, table, record } = req.body;

    if (!eventType || !record) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Find response by airtableRecordId
    const response = await Response.findOne({ airtableRecordId: record.id });

    if (!response) {
      // Record doesn't exist in our DB, might be from a different form
      return res.status(200).json({ message: 'Record not found in database' });
    }

    switch (eventType) {
      case 'record.updated':
        // Update the response in our database
        // Note: We don't update the answers field directly from Airtable
        // as we want to preserve the original submission format
        response.updatedAt = new Date();
        response.status = 'active';
        await response.save();
        break;

      case 'record.deleted':
        // Mark as deleted in Airtable
        response.status = 'deletedInAirtable';
        await response.save();
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;

