# AI-Powered RFP Management System

A full-stack web application that streamlines the Request for Proposal (RFP) procurement workflow using AI. Built with the MERN stack (MongoDB, Express, React, Node.js) and Google Gemini AI.

## 📋 Table of Contents

1. [Project Setup](#-project-setup)
2. [Tech Stack](#-tech-stack)
3. [API Documentation](#-api-documentation)
4. [Decisions & Assumptions](#-decisions--assumptions)
5. [AI Tools Usage](#-ai-tools-usage)

---

## 🚀 Project Setup

### Prerequisites

| Requirement           | Version | Notes                                                               |
| --------------------- | ------- | ------------------------------------------------------------------- |
| Node.js               | v18+    | Required for ES modules support                                     |
| Yarn                  | v1.22+  | Package manager                                                     |
| MongoDB Atlas         | -       | Cloud database (free tier works)                                    |
| Google Gemini API Key | -       | Get from [Google AI Studio](https://aistudio.google.com/app/apikey) |
| Gmail Account         | -       | With App Password enabled for SMTP/IMAP                             |

### Installation Steps

#### 1. Clone the Repository

```bash
git clone <repo-url>
cd <project-folder>
```

#### 2. Install Backend Dependencies

```bash
cd backend
yarn install
```

#### 3. Install Frontend Dependencies

```bash
cd ../frontend
yarn install
```

#### 4. Configure Environment Variables

**Backend Configuration** (`backend/.env`):

```bash
cd ../backend
cp .env-sample .env
```

Edit `backend/.env` with your values:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here

# SMTP Configuration (for sending emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# IMAP Configuration (for receiving emails)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_SECURE=true
IMAP_USER=your-email@gmail.com
IMAP_PASS=your-app-password

# Email Settings
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=RFP Management System
```

**Frontend Configuration** (`frontend/.env`):

```bash
cd ../frontend
cp .env-sample .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Email Configuration (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account → Security → 2-Step Verification → App Passwords
   - Select "Mail" and generate
   - Use this password for both `SMTP_PASS` and `IMAP_PASS`
3. **Enable IMAP** in Gmail Settings → Forwarding and POP/IMAP

### Running Locally

#### Terminal 1 - Backend

```bash
cd backend
yarn dev
```

Backend runs on: http://localhost:5001

#### Terminal 2 - Frontend

```bash
cd frontend
yarn dev
```

Frontend runs on: http://localhost:3000

### Seed Data / Initial Setup

No seed data required. The application starts with empty collections:

1. Create vendors first via the Vendor Management page
2. Create RFPs using natural language
3. Send RFPs to vendors
4. Check for vendor responses (manual button or automatic cron every 15 minutes)

---

## 🛠 Tech Stack

| Layer               | Technology                          | Purpose                                       |
| ------------------- | ----------------------------------- | --------------------------------------------- |
| **Frontend**        | React 18 + Vite                     | Modern, fast UI development                   |
| **UI Library**      | Chakra UI v2                        | Component library with built-in accessibility |
| **State/Routing**   | React Router v6                     | Client-side routing                           |
| **HTTP Client**     | Axios                               | API communication                             |
| **Validation**      | Yup                                 | Form validation schemas                       |
| **Backend**         | Node.js + Express                   | REST API server                               |
| **Database**        | MongoDB Atlas + Mongoose            | Document database with ODM                    |
| **AI Provider**     | Google Gemini (gemini-flash-latest) | LLM for NLP tasks                             |
| **Email Send**      | Nodemailer (SMTP)                   | Outbound email delivery                       |
| **Email Receive**   | imap-simple                         | Inbound email polling                         |
| **Job Scheduler**   | node-cron                           | Automated email checking every 15 min         |
| **Package Manager** | Yarn                                | Dependency management                         |

### Key Libraries

**Backend:**

- `@google/genai` - Google Gemini AI SDK
- `nodemailer` - SMTP email sending
- `imap-simple` - IMAP email receiving
- `node-cron` - Scheduled job execution
- `pdf-parse` - PDF text extraction
- `mongoose` - MongoDB ODM

**Frontend:**

- `@chakra-ui/react` - UI components
- `react-router-dom` - Routing
- `axios` - HTTP client
- `yup` - Validation

---

## 📚 API Documentation

### Base URL

```
http://localhost:5001/api
```

### RFPs

| Method | Endpoint         | Description                                 |
| ------ | ---------------- | ------------------------------------------- |
| GET    | `/rfps`          | Get all RFPs                                |
| GET    | `/rfps/:id`      | Get single RFP by ID                        |
| POST   | `/rfps`          | Create RFP (natural language or structured) |
| PUT    | `/rfps/:id`      | Update RFP                                  |
| DELETE | `/rfps/:id`      | Delete RFP                                  |
| POST   | `/rfps/:id/send` | Send RFP to selected vendors                |

#### Create RFP with Natural Language

```http
POST /api/rfps
Content-Type: application/json

{
  "naturalLanguage": "I need to procure 20 laptops with 16GB RAM and 15 monitors 27-inch. Budget is $50,000 total. Need delivery within 30 days. Payment terms should be net 30, and we need at least 1 year warranty."
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "675482a1...",
    "rfpId": "RFP-1765001078164-abc123",
    "title": "Procurement of Laptops and Monitors",
    "description": "Office equipment procurement...",
    "items": [
      { "name": "Laptop", "quantity": 20, "specifications": "16GB RAM" },
      { "name": "Monitor", "quantity": 15, "specifications": "27-inch" }
    ],
    "budget": 50000,
    "timeline": "30 days",
    "paymentTerms": "Net 30",
    "warranty": "1 year",
    "status": "draft",
    "createdAt": "2025-12-07T..."
  }
}
```

#### Send RFP to Vendors

```http
POST /api/rfps/:id/send
Content-Type: application/json

{
  "vendorIds": ["vendor_id_1", "vendor_id_2"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "successCount": 2,
    "failedCount": 0,
    "results": [
      { "vendorId": "...", "email": "vendor@example.com", "success": true }
    ]
  }
}
```

### Vendors

| Method | Endpoint       | Description       |
| ------ | -------------- | ----------------- |
| GET    | `/vendors`     | Get all vendors   |
| GET    | `/vendors/:id` | Get single vendor |
| POST   | `/vendors`     | Create vendor     |
| PUT    | `/vendors/:id` | Update vendor     |
| DELETE | `/vendors/:id` | Delete vendor     |

#### Create Vendor

```http
POST /api/vendors
Content-Type: application/json

{
  "name": "Acme Tech Solutions",
  "email": "sales@acmetech.com",
  "contactInfo": "Phone: 555-0123"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "675483b2...",
    "name": "Acme Tech Solutions",
    "email": "sales@acmetech.com",
    "contactInfo": "Phone: 555-0123"
  }
}
```

### Proposals

| Method | Endpoint                | Description                  |
| ------ | ----------------------- | ---------------------------- |
| GET    | `/proposals/rfp/:rfpId` | Get all proposals for an RFP |
| GET    | `/proposals/:id`        | Get single proposal          |
| POST   | `/proposals/parse`      | Create/parse manual proposal |

#### Manual Proposal Entry (for testing)

```http
POST /api/proposals/parse
Content-Type: application/json

{
  "rfpId": "rfp_object_id",
  "vendorId": "vendor_object_id",
  "content": "Dear Team,\n\nHere is our proposal:\n- Laptops: $1,200 each = $24,000\n- Monitors: $400 each = $6,000\nTotal: $30,000\nDelivery: 25 days\nWarranty: 2 years"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "rfpId": "...",
    "vendorId": { "name": "Acme Tech", "email": "..." },
    "proposalNumber": 1,
    "extractedData": {
      "totalPrice": 30000,
      "items": [
        {
          "name": "Laptop",
          "quantity": 20,
          "unitPrice": 1200,
          "totalPrice": 24000
        },
        {
          "name": "Monitor",
          "quantity": 15,
          "unitPrice": 400,
          "totalPrice": 6000
        }
      ],
      "deliveryTerms": "25 days",
      "warranty": "2 years",
      "compliance": { "meetsBudget": true, "meetsTimeline": true }
    },
    "status": "parsed"
  }
}
```

### Comparisons

| Method | Endpoint                           | Description               |
| ------ | ---------------------------------- | ------------------------- |
| GET    | `/comparisons/rfp/:rfpId`          | Get comparison for an RFP |
| POST   | `/comparisons/rfp/:rfpId/generate` | Generate AI comparison    |

#### Generate AI Comparison

```http
POST /api/comparisons/rfp/:rfpId/generate
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "rfpId": "...",
    "aiSummary": "Analysis of 3 proposals received...",
    "aiRecommendation": {
      "proposalId": "...",
      "vendorId": { "name": "Acme Tech" },
      "reasoning": "Best value with full compliance...",
      "confidence": 0.85
    },
    "scores": [
      {
        "proposalId": "...",
        "vendorId": { "name": "Acme Tech" },
        "priceScore": 85,
        "complianceScore": 95,
        "termsScore": 90,
        "completenessScore": 88,
        "overallScore": 89
      }
    ]
  }
}
```

### Email

| Method | Endpoint       | Description                                       |
| ------ | -------------- | ------------------------------------------------- |
| POST   | `/email/check` | Manually trigger inbox check for vendor responses |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "processed": 2,
    "failed": 0,
    "emails": [
      {
        "proposalId": "...",
        "proposalNumber": 1,
        "vendorName": "Acme Tech",
        "rfpTitle": "Laptop Procurement",
        "parsed": true,
        "extractedData": { "totalPrice": 30000, ... }
      }
    ]
  }
}
```

### Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

| Status Code | Meaning                            |
| ----------- | ---------------------------------- |
| 400         | Bad Request - Invalid input        |
| 404         | Not Found - Resource doesn't exist |
| 500         | Server Error - Internal error      |

---

## 🎯 Decisions & Assumptions

### Key Design Decisions

#### 1. RFP Data Model

- **Flexible `items` array**: Supports variable product requirements without schema changes
- **Unique `rfpId`**: Auto-generated ID (e.g., `RFP-1765001078164-abc123`) for email tracking
- **`structuredData` field**: Preserves original AI extraction for debugging/auditing
- **Status workflow**: `draft` → `sent` → `completed`

#### 2. AI Integration Strategy

| Use Case         | Approach                                                  |
| ---------------- | --------------------------------------------------------- |
| RFP Creation     | Structured output with `responseSchema` for reliable JSON |
| Proposal Parsing | Extract prices, terms, compliance from messy text         |
| Comparison       | Multi-criteria scoring with weighted factors              |

- **Model**: `gemini-flash-latest` - Fast, cost-effective, good for structured extraction
- **Streaming**: Used for responsive UX during content generation
- **Fallbacks**: Graceful degradation when AI extraction fails

#### 3. Email Workflow

- **Outbound (SMTP)**: Professional HTML templates with RFP ID in subject
- **Inbound (IMAP)**:
  - Optimized search: Only fetches emails FROM known vendor addresses
  - Duplicate detection: Uses email `Message-ID` to prevent reprocessing
  - Smart RFP matching: Auto-matches to recent RFP if ID not in email
- **Cron Job**: Automatic check every 15 minutes + manual button

#### 4. Proposal Numbering

- Each vendor can send multiple proposals per RFP
- Proposals are numbered: `#1`, `#2`, `#3` per vendor per RFP
- All proposals are kept for comparison (no overwriting)

#### 5. Scoring Logic

AI evaluates proposals across 4 dimensions:
| Criterion | Weight | Description |
|-----------|--------|-------------|
| Price Score | 30% | Value vs budget (considers total cost) |
| Compliance Score | 30% | Meeting RFP requirements |
| Terms Score | 20% | Payment/delivery terms alignment |
| Completeness Score | 20% | Response thoroughness |

### Assumptions

1. **Single-user system**: No authentication or multi-tenant support required
2. **Email format**: Vendors include RFP ID in subject OR we match by sender email
3. **Currency**: All monetary values in USD
4. **Attachments**: PDF attachments are text-extractable (not scanned images)
5. **Email provider**: Gmail with App Passwords (configurable for other providers)
6. **Response format**: Vendors respond via email with pricing in body or PDF

### Known Limitations

1. **No real-time updates**: Email polling every 15 min (or manual trigger)
2. **PDF only**: Attachment parsing limited to PDF format
3. **No file upload UI**: Attachments only via email
4. **Basic templates**: Email templates are functional, not customizable
5. **English only**: AI prompts optimized for English content

---

## 🤖 AI Tools Usage

### Tools Used During Development

| Tool              | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| **Cursor AI**     | Code generation, debugging, architecture decisions      |
| **Google Gemini** | Core AI functionality (extraction, parsing, comparison) |

### What AI Helped With

1. **Boilerplate Generation**

   - Express routes and middleware
   - React components with Chakra UI
   - Mongoose model schemas
   - Error handling patterns

2. **AI Integration Design**

   - Structured output schemas for Gemini
   - Prompt engineering for extraction tasks
   - Streaming response handling

3. **Debugging & Problem Solving**

   - IMAP query optimization (fixed OR syntax issues)
   - Email body extraction from various formats
   - Async/await issues in route handlers

4. **Architecture Decisions**
   - Job history tracking for cron monitoring
   - Duplicate email detection strategy
   - Proposal numbering system

### Notable Approaches

**Structured Output with Gemini:**

```javascript
const config = {
  responseMimeType: "application/json",
  responseSchema: {
    type: Type.OBJECT,
    required: ["title", "items", "budget"],
    properties: {
      title: { type: Type.STRING },
      items: { type: Type.ARRAY, items: { ... } },
      budget: { type: Type.NUMBER }
    }
  }
};
```

This approach ensures:

- Consistent JSON output (no parsing failures)
- Type-safe responses
- Nullable fields for missing data

### Key Learnings

1. **Structured output > Free-form parsing**: Gemini's `responseSchema` eliminates JSON parsing errors
2. **Streaming requires careful handling**: Chunk concatenation before JSON parsing
3. **IMAP optimization matters**: Server-side filtering vs fetching all emails
4. **Default values are crucial**: AI may not extract all fields; fallbacks prevent crashes

---

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/         # Database, AI, email, constants
│   │   ├── controllers/    # Route handlers
│   │   ├── jobs/           # Cron jobs (email check)
│   │   ├── middleware/     # Error handling
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic (AI, email, parser)
│   │   ├── utils/          # Helpers (PDF parser)
│   │   └── server.js       # Entry point
│   ├── tests/              # Jest tests
│   ├── .env-sample         # Environment template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── config/         # Frontend configuration
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   └── App.jsx         # Routes
│   ├── .env-sample         # Environment template
│   └── package.json
│
└── README.md
```

---

## 🧪 Testing the Flow

### Complete Demo Walkthrough

#### 1. Create Vendors

- Navigate to **Vendors** → **Add Vendor**
- Add: "Acme Tech Solutions" / "acme@example.com"
- Add: "TechCorp Inc" / "techcorp@example.com"

#### 2. Create RFP from Natural Language

- Go to **Dashboard** → **Create RFP**
- Enter: _"I need 20 laptops with 16GB RAM and 15 monitors 27-inch. Budget is $50,000 total. Need delivery within 30 days. Payment terms should be net 30, and we need at least 1 year warranty."_
- Click **Extract RFP Details**
- Review extracted data → **Save RFP**

#### 3. Send RFP to Vendors

- Click **View** on your RFP
- Click **Send to Vendors**
- Select vendors → **Send RFP**

#### 4. Receive Vendor Responses

**Option A - Automatic (via email):**

- Vendors reply to the RFP email
- System checks inbox every 15 minutes
- Or click **Check Proposals** button

**Option B - Manual (for testing):**

- On RFP detail page, click **Add Proposal**
- Select vendor and enter proposal text
- Click **Add & Parse Proposal**

#### 5. Compare & Get Recommendation

- Click **View Comparison**
- Click **Generate AI Comparison**
- Review scores, summary, and recommendation

---

## 📝 Future Improvements

### Phase 1 - API & Performance

- [ ] **Swagger API Documentation** - Interactive API docs at `/api-docs`
- [ ] **Rate Limiting** - Prevent API abuse with express-rate-limit
- [ ] **Caching** - Redis caching for frequently accessed data (RFPs, vendors)
- [ ] **API Optimization** - Query optimization, pagination, indexing

### Phase 2 - Frontend

- [ ] **UI Responsiveness** - Mobile-first responsive design
- [ ] **Loading States** - Skeleton loaders, better UX feedback
- [ ] **Error Boundaries** - Graceful error handling in React

### Phase 3 - Features

- [ ] Real-time email polling with WebSocket updates
- [ ] File upload UI for proposal attachments
- [ ] Customizable email templates
- [ ] Export comparisons to PDF/CSV
- [ ] Multi-user support with authentication
- [ ] Historical comparison tracking
- [ ] Batch RFP operations

---

## 📄 License

ISC License
