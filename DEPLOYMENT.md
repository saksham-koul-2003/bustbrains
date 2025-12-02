# Deployment Guide

This guide will help you deploy BustBrain to production.

## Prerequisites

- GitHub account
- MongoDB Atlas account (or your own MongoDB instance)
- Airtable account with OAuth app configured
- Render/Railway account (for backend)
- Vercel/Netlify account (for frontend)

## Step 1: Prepare Your Code

1. Push your code to GitHub
2. Ensure all environment variables are documented in `env.example`

## Step 2: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP addresses (or use 0.0.0.0/0 for Render/Railway)
5. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/bustbrain`

## Step 3: Update Airtable OAuth App

1. Go to your Airtable OAuth app settings
2. Add production redirect URI: `https://your-backend-url.com/api/auth/airtable/callback`
3. Note your Client ID and Client Secret

## Step 4: Deploy Backend (Render)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `bustbrain-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: `backend`

5. Set Environment Variables:
   ```
   PORT=10000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   AIRTABLE_CLIENT_ID=your_client_id
   AIRTABLE_CLIENT_SECRET=your_client_secret
   AIRTABLE_REDIRECT_URI=https://your-backend-url.onrender.com/api/auth/airtable/callback
   AIRTABLE_SCOPE=data.records:read data.records:write schema.bases:read schema.bases:write
   FRONTEND_URL=https://your-frontend-url.vercel.app
   SESSION_SECRET=generate_a_random_secret_here
   WEBHOOK_SECRET=generate_another_random_secret_here
   ```

6. Deploy and note your backend URL

## Step 5: Deploy Backend (Railway - Alternative)

1. Go to [Railway](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add service → Select `backend` directory
5. Set environment variables (same as Render)
6. Deploy

## Step 6: Deploy Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Set Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

6. Deploy and note your frontend URL

## Step 7: Deploy Frontend (Netlify - Alternative)

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

5. Set Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

6. Deploy

## Step 8: Update Environment Variables

After deployment, update:

1. **Backend**: Update `FRONTEND_URL` to your actual frontend URL
2. **Backend**: Update `AIRTABLE_REDIRECT_URI` to your actual backend callback URL
3. **Airtable**: Update OAuth redirect URI to match backend

## Step 9: Set Up Airtable Webhooks

1. Go to your Airtable base
2. Navigate to Extensions → Webhooks
3. Create a new webhook for your table
4. Set webhook URL: `https://your-backend-url.com/api/webhooks/airtable`
5. Add header: `X-Airtable-Webhook-Secret: your_webhook_secret`
6. Select events: `record.updated`, `record.deleted`

## Step 10: Test Deployment

1. Visit your frontend URL
2. Try logging in with Airtable
3. Create a test form
4. Submit a test response
5. Verify response appears in both Airtable and your database

## Troubleshooting

### Backend Issues

- **CORS errors**: Verify `FRONTEND_URL` matches exactly
- **OAuth fails**: Check redirect URI matches in Airtable and backend
- **MongoDB connection**: Verify connection string and IP whitelist

### Frontend Issues

- **API calls fail**: Check `VITE_API_URL` is set correctly
- **Build fails**: Ensure all dependencies are in `package.json`

### Webhook Issues

- **Webhooks not received**: Verify webhook URL is publicly accessible
- **401 errors**: Check webhook secret matches

## Environment Variables Reference

### Backend (.env)
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
AIRTABLE_CLIENT_ID=...
AIRTABLE_CLIENT_SECRET=...
AIRTABLE_REDIRECT_URI=https://...
AIRTABLE_SCOPE=data.records:read data.records:write schema.bases:read schema.bases:write
FRONTEND_URL=https://...
SESSION_SECRET=...
WEBHOOK_SECRET=...
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com
```

## Security Notes

- Never commit `.env` files
- Use strong, random secrets for `SESSION_SECRET` and `WEBHOOK_SECRET`
- Keep your Airtable Client Secret secure
- Use HTTPS in production
- Regularly rotate secrets

## Monitoring

- Set up error tracking (e.g., Sentry)
- Monitor MongoDB connection
- Check webhook delivery in Airtable dashboard
- Monitor API response times

