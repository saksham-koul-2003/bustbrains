import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Target backend URL (where your actual webhook endpoint is)
const TARGET_BACKEND_URL = process.env.TARGET_BACKEND_URL || 'http://localhost:5000';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '73oTEr>n/4X';

/**
 * Proxy endpoint that Airtable will call
 * This adds the webhook secret header and forwards to your backend
 */
app.post('/webhook', async (req, res) => {
  try {
    console.log('Received webhook request from Airtable');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    // Forward the request to your backend with the secret header
    const response = await axios.post(
      `${TARGET_BACKEND_URL}/api/webhooks/airtable`,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Airtable-Webhook-Secret': WEBHOOK_SECRET,
          // Forward any other headers from Airtable
          ...req.headers
        }
      }
    );

    console.log('Forwarded to backend successfully');
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);
    
    if (error.response) {
      // Forward the error response from backend
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ 
        error: 'Proxy error', 
        message: error.message 
      });
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Webhook proxy is running',
    target: TARGET_BACKEND_URL
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BustBrain Webhook Proxy',
    endpoint: '/webhook',
    target: TARGET_BACKEND_URL
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Webhook Proxy Server running on port ${PORT}`);
  console.log(`📡 Proxy endpoint: http://localhost:${PORT}/webhook`);
  console.log(`🎯 Forwarding to: ${TARGET_BACKEND_URL}/api/webhooks/airtable`);
  console.log(`🔐 Using webhook secret: ${WEBHOOK_SECRET ? '***' + WEBHOOK_SECRET.slice(-4) : 'NOT SET'}`);
});


