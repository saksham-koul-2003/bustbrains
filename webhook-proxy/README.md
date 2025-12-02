# Webhook Proxy Server

A simple proxy server that adds the `X-Airtable-Webhook-Secret` header to Airtable webhook requests before forwarding them to your main backend.

## Why This Exists

Airtable's native webhooks don't support custom headers. This proxy server:
1. Receives webhook requests from Airtable
2. Adds the `X-Airtable-Webhook-Secret` header
3. Forwards the request to your main backend

## Setup

### 1. Install Dependencies

```bash
cd webhook-proxy
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5001
TARGET_BACKEND_URL=http://localhost:5000
WEBHOOK_SECRET=73oTEr>n/4X
```

For production:
```env
PORT=5001
TARGET_BACKEND_URL=https://your-backend-url.com
WEBHOOK_SECRET=73oTEr>n/4X
```

### 3. Run the Proxy

```bash
npm start
# or for development
npm run dev
```

The proxy will run on `http://localhost:5001`

## Usage

### In Airtable Webhook Configuration

When setting up your Airtable webhook (via API or extension), use:

**Webhook URL**: `https://your-proxy-url.com/webhook`

The proxy will automatically:
- Add the `X-Airtable-Webhook-Secret` header
- Forward to your backend at `/api/webhooks/airtable`

### Example Airtable Webhook Setup

If using Airtable API to create webhook:

```javascript
const webhookUrl = 'https://your-proxy-url.com/webhook';
// Airtable will call this URL
// Proxy adds header and forwards to your backend
```

### Testing

Test the proxy locally:

```bash
curl -X POST http://localhost:5001/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "record.updated",
    "base": {"id": "base123"},
    "table": {"id": "table123"},
    "record": {"id": "rec123", "fields": {}}
  }'
```

## Deployment

### Option 1: Deploy Separately (Recommended)

Deploy the proxy as a separate service on Render/Railway:

1. Create new service
2. Set root directory to `webhook-proxy`
3. Set environment variables
4. Deploy

**Benefits:**
- Can scale independently
- Isolated from main backend
- Easy to update

### Option 2: Add to Main Backend

You can also add a proxy route directly to your main backend (see `backend/routes/webhooks.js` for alternative implementation).

## Architecture

```
Airtable → Proxy Server (adds header) → Main Backend
         (port 5001)                  (port 5000)
```

## Environment Variables

- `PORT`: Port for proxy server (default: 5001)
- `TARGET_BACKEND_URL`: Your main backend URL
- `WEBHOOK_SECRET`: Secret that matches your backend's `WEBHOOK_SECRET`

## Security Notes

- The proxy adds the secret header, so Airtable doesn't need to know it
- Keep `WEBHOOK_SECRET` secure and never commit it
- Use HTTPS in production
- Consider adding rate limiting if needed

## Troubleshooting

**Proxy not forwarding:**
- Check `TARGET_BACKEND_URL` is correct
- Verify main backend is running
- Check network connectivity

**401 Unauthorized:**
- Verify `WEBHOOK_SECRET` matches in both proxy and backend
- Check backend logs for header verification

**Connection refused:**
- Ensure main backend is accessible from proxy
- Check firewall/network settings


