# BustBrain - Form Builder with Airtable Integration

A full-stack application that allows users to create custom forms using Airtable fields, apply conditional logic, and sync responses between Airtable and MongoDB.

## 🚀 Features

- **Airtable OAuth Authentication** - Secure login using Airtable OAuth
- **Form Builder** - Create custom forms from Airtable bases and tables
- **Conditional Logic** - Show/hide questions based on previous answers
- **Dual Storage** - Save responses to both Airtable and MongoDB
- **Response Management** - View and manage all form responses
- **Webhook Sync** - Keep MongoDB in sync with Airtable changes

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Airtable account with OAuth app configured
- npm or yarn

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd BustBrain
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/bustbrain

AIRTABLE_CLIENT_ID=your_airtable_client_id
AIRTABLE_CLIENT_SECRET=your_airtable_client_secret
AIRTABLE_REDIRECT_URI=http://localhost:5000/api/auth/airtable/callback
AIRTABLE_SCOPE=data.records:read data.records:write schema.bases:read schema.bases:write

FRONTEND_URL=http://localhost:3000

SESSION_SECRET=your_random_session_secret_here
WEBHOOK_SECRET=your_webhook_secret_here
```

Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🔐 Airtable OAuth Setup

1. Go to [Airtable Developer Portal](https://airtable.com/create/oauth)
2. Create a new OAuth app
3. Set the redirect URI to: `http://localhost:5000/api/auth/airtable/callback` (for development)
4. Copy the Client ID and Client Secret
5. Add the following scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
   - `schema.bases:write`
6. Update your `.env` file with these credentials

For production, update the redirect URI to your production backend URL.

## 📊 Data Model

### User Model
- `airtableUserId` - Unique Airtable user ID
- `email` - User email
- `name` - User name
- `accessToken` - OAuth access token
- `refreshToken` - OAuth refresh token
- `tokenExpiresAt` - Token expiration timestamp
- `loginTimestamp` - Last login time

### Form Model
- `owner` - Reference to User
- `title` - Form title
- `airtableBaseId` - Airtable base ID
- `airtableTableId` - Airtable table ID
- `questions` - Array of question objects:
  - `questionKey` - Internal identifier
  - `airtableFieldId` - Airtable field ID
  - `label` - Display label
  - `type` - Field type (singleLineText, multilineText, singleSelect, multipleSelects, multipleAttachments)
  - `required` - Boolean for required field
  - `conditionalRules` - Conditional logic rules (see below)
  - `options` - Available options for select fields

### Response Model
- `formId` - Reference to Form
- `airtableRecordId` - Airtable record ID
- `answers` - JSON object with form answers
- `status` - Response status (active, deletedInAirtable)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## 🔀 Conditional Logic

Conditional logic allows you to show/hide questions based on previous answers.

### Structure

```javascript
{
  logic: "AND" | "OR",
  conditions: [
    {
      questionKey: "role",
      operator: "equals" | "notEquals" | "contains",
      value: "Engineer"
    }
  ]
}
```

### Example

Show `githubUrl` only if `role` equals "Engineer":

```javascript
{
  logic: "AND",
  conditions: [
    {
      questionKey: "role",
      operator: "equals",
      value: "Engineer"
    }
  ]
}
```

### Operators

- **equals**: Exact match (works with strings, numbers, and arrays)
- **notEquals**: Not equal to value
- **contains**: For arrays, checks if value is in array; for strings, checks substring

### Implementation

The conditional logic is implemented as a pure function `shouldShowQuestion()` that:
- Returns `true` if no rules are defined
- Evaluates each condition
- Combines results using AND/OR logic
- Handles missing values gracefully

Both frontend and backend use the same implementation for consistency.

## 🔗 Webhook Configuration

To keep your database in sync with Airtable:

### Option 1: Using Webhook Proxy (Recommended)

Since Airtable doesn't support custom headers, use the included proxy server:

1. **Set up the proxy server:**
   ```bash
   cd webhook-proxy
   npm install
   cp env.example .env
   # Edit .env with your settings
   npm start
   ```

2. **Configure Airtable webhook** to point to: `https://your-proxy-url.com/webhook`
   - The proxy will add the secret header automatically
   - See `webhook-proxy/README.md` for details

### Option 2: Direct Webhook (Without Header)

1. Set up a webhook in Airtable for your table
2. Configure the webhook URL to point to: `https://your-backend-url.com/api/webhooks/airtable`
3. Set the webhook secret in your `.env` file
4. The webhook will handle:
   - `record.updated` - Updates the response timestamp
   - `record.deleted` - Marks response as `deletedInAirtable`

**Note:** For production, use the proxy server (Option 1) to ensure security with the webhook secret header.

### Webhook Payload Format

Airtable will send webhooks in this format:

```json
{
  "eventType": "record.updated",
  "base": { "id": "baseId" },
  "table": { "id": "tableId" },
  "record": { "id": "recordId", "fields": {...} }
}
```

## 🎯 Supported Field Types

The application supports the following Airtable field types:

- **singleLineText** - Short text input
- **multilineText** - Long text textarea
- **singleSelect** - Dropdown select
- **multipleSelects** - Multiple checkbox selection
- **multipleAttachments** - File upload (basic support)

All other field types are automatically filtered out during form creation.

## 📡 API Endpoints

### Authentication
- `GET /api/auth/airtable` - Initiate OAuth flow
- `GET /api/auth/airtable/callback` - OAuth callback
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Forms
- `GET /api/forms` - Get all user forms
- `GET /api/forms/:formId` - Get single form
- `POST /api/forms` - Create new form
- `PUT /api/forms/:formId` - Update form
- `DELETE /api/forms/:formId` - Delete form
- `GET /api/forms/bases` - Get Airtable bases
- `GET /api/forms/bases/:baseId/tables` - Get tables from base
- `GET /api/forms/bases/:baseId/tables/:tableId/fields` - Get fields from table

### Responses
- `POST /api/responses/:formId` - Submit form response
- `GET /api/responses/:formId` - Get all responses for a form
- `GET /api/responses/:formId/:responseId` - Get single response

### Webhooks
- `POST /api/webhooks/airtable` - Airtable webhook endpoint

## 🚢 Deployment

### Backend (Render/Railway)

1. Push your code to GitHub
2. Connect your repository to Render/Railway
3. Set environment variables in the platform dashboard
4. Update `AIRTABLE_REDIRECT_URI` to your production backend URL
5. Deploy

### Frontend (Vercel/Netlify)

1. Connect your repository
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Set environment variable `VITE_API_URL` to your backend URL
5. Deploy

### Environment Variables for Production

Update these in your deployment platform:

**Backend:**
- `MONGODB_URI` - Your MongoDB connection string
- `AIRTABLE_REDIRECT_URI` - Your production callback URL
- `FRONTEND_URL` - Your frontend URL
- `SESSION_SECRET` - Strong random secret
- `WEBHOOK_SECRET` - Webhook verification secret

**Frontend:**
- `VITE_API_URL` - Your backend API URL

## 🧪 Testing

### Test Conditional Logic

```javascript
import { shouldShowQuestion } from './utils/conditionalLogic';

const rules = {
  logic: "AND",
  conditions: [
    { questionKey: "role", operator: "equals", value: "Engineer" }
  ]
};

const answers = { role: "Engineer" };
console.log(shouldShowQuestion(rules, answers)); // true
```

## 📝 Project Structure

```
BustBrain/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Form.js
│   │   └── Response.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── forms.js
│   │   ├── responses.js
│   │   └── webhooks.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   ├── airtableClient.js
│   │   └── conditionalLogic.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FormBuilder.jsx
│   │   │   ├── FormViewer.jsx
│   │   │   └── ResponsesList.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── utils/
│   │   │   └── conditionalLogic.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── webhook-proxy/
│   ├── server.js
│   ├── package.json
│   └── README.md
└── README.md
```

## 🐛 Troubleshooting

### OAuth Issues
- Verify redirect URI matches exactly in Airtable and `.env`
- Check that scopes are correctly set
- Ensure backend is accessible at the redirect URI

### MongoDB Connection
- Verify MongoDB is running (if local)
- Check connection string format
- Ensure network access is allowed (if using Atlas)

### Webhook Issues
- Verify webhook URL is publicly accessible
- Check webhook secret matches
- Review webhook logs in Airtable dashboard

## 📄 License

ISC

## 👤 Author

Built as a full-stack form builder application with Airtable integration.

