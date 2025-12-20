# 📞 AI PHONE INTERVIEW - SETUP GUIDE

Complete setup instructions for the AI-powered phone interview system.

---

## 🎯 OVERVIEW

This system enables automated AI phone interviews using:
- **Twilio** - Phone calls
- **Google Calendar** - Scheduling
- **n8n** - Workflow automation
- **GPT-4** - AI interviewer
- **Google Speech-to-Text** - Voice recognition

---

## 📋 PREREQUISITES

### 1. Twilio Account Setup

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account ($15 credit)
3. Get a phone number:
   - Dashboard → Phone Numbers → Buy a Number
   - Choose one with Voice capabilities
4. Get your credentials:
   - Account SID (starts with `AC...`)
   - Auth Token (click to reveal)

### 2. Google Cloud Project

#### Enable APIs:
```bash
# Go to: https://console.cloud.google.com/

1. Create new project or select existing
2. Enable these APIs:
   - Google Calendar API
   - Google Speech-to-Text API
3. Create Service Account:
   - IAM & Admin → Service Accounts → Create
   - Grant "Editor" role
   - Create key (JSON format)
   - Download the JSON file
```

#### Get Calendar ID:
```bash
1. Open Google Calendar
2. Settings → Settings for my calendars → Select calendar
3. Scroll to "Integrate calendar"
4. Copy "Calendar ID" (e.g., youremail@gmail.com or random@group.calendar.google.com)
```

### 3. n8n Setup

#### Option A: n8n Cloud (Easiest)
```bash
1. Go to: https://n8n.io/cloud
2. Sign up for free trial
3. Create a new workflow
4. Import the workflow JSON (provided below)
```

#### Option B: Self-Hosted (Docker)
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

Access at: `http://localhost:5678`

### 4. OpenAI API Key

```bash
1. Go to: https://platform.openai.com/api-keys
2. Create new secret key
3. Copy the key (starts with sk-...)
```

---

## 🔧 INSTALLATION

### Backend Setup

1. **Install dependencies:**
```bash
cd hireready-rag-backend
npm install
```

2. **Create `.env` file:**
```env
# Existing keys
GOOGLE_API_KEY=your_google_api_key_for_embeddings
GEMINI_API_KEY=your_gemini_api_key_for_chat
PORT=5000

# New - Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# New - Google Calendar
GOOGLE_SERVICE_ACCOUNT_PATH=./google-service-account.json
GOOGLE_CALENDAR_ID=your_calendar_id@gmail.com

# New - n8n
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook
BACKEND_PUBLIC_URL=https://your-backend.com

# Optional - Google Speech-to-Text
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

3. **Place Service Account JSON:**
```bash
# Copy the downloaded JSON file to:
hireready-rag-backend/google-service-account.json
```

4. **Start the backend:**
```bash
npm start
```

---

## 🔗 TWILIO WEBHOOK CONFIGURATION

### 1. Expose Your Local Backend (For Development)

Use **ngrok** to expose localhost:

```bash
# Install ngrok
npm install -g ngrok

# Expose port 5000
ngrok http 5000
```

You'll get a URL like: `https://abc123.ngrok.io`

### 2. Configure Twilio Webhooks

1. Go to Twilio Console → Phone Numbers → Manage → Active Numbers
2. Click your phone number
3. Scroll to "Voice Configuration"
4. Set these values:

```
Configure with: Webhooks/TwiML
A call comes in: Webhook
URL: https://your-backend.com/phonic/webhook/voice
HTTP: POST

Call Status Changes: 
URL: https://your-backend.com/phonic/webhook/status
HTTP: POST
```

---

## 🤖 n8n WORKFLOW SETUP

### 1. Import Workflow

1. Open n8n
2. Click "+" → Import from File
3. Select: `hireready-rag-backend/n8n-workflow/hireready-phone-interview.json`

### 2. Configure Credentials

#### Google Calendar:
- Click "Google Calendar Trigger" node
- Click "Create New Credential"
- Authenticate with your Google account

#### Twilio:
- Click "Twilio Make Call" node
- Add credentials:
  - Account SID
  - Auth Token

#### OpenAI:
- Click "GPT - Generate Feedback" node
- Add API key

### 3. Set Environment Variables in n8n

In n8n Settings → Variables, add:

```
GOOGLE_CALENDAR_ID=your_calendar_id
BACKEND_URL=https://your-backend.com
TWILIO_PHONE_NUMBER=+1234567890
FRONTEND_URL=https://your-frontend.com
```

### 4. Activate Workflow

Click the toggle to activate the workflow ✅

---

## 🎨 FRONTEND INTEGRATION

### Install Required Packages

```bash
cd ..  # Back to root directory
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid
```

### Add Scheduling Page

The component is already created at:
`src/routes/phonic-schedule.tsx`

---

## 🧪 TESTING

### 1. Test Backend Endpoints

```bash
# Test health
curl http://localhost:5000

# Test scheduling (replace with real data)
curl -X POST http://localhost:5000/phonic/schedule/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "userName": "Test User",
    "userPhone": "+919876543210",
    "scheduledDate": "2025-12-25",
    "scheduledTime": "14:00",
    "duration": 15
  }'
```

### 2. Test Twilio Webhook

```bash
# Test voice webhook
curl -X POST http://localhost:5000/phonic/webhook/voice \
  -d "CallSid=TEST123" \
  -d "From=+919876543210"
```

### 3. Test Full Flow

1. Schedule an interview for 2 minutes from now
2. Check Google Calendar - event should appear
3. Wait for n8n to trigger
4. Phone should ring
5. Answer and go through interview
6. Check backend logs for transcript

---

## 🚀 DEPLOYMENT

### Backend (Railway/Render)

```bash
# Deploy to Railway
railway login
railway init
railway up

# Or Render
# Connect GitHub repo and deploy
```

### n8n (Keep Running)

For n8n Cloud: Already deployed ✅

For Self-hosted:
```bash
# Use PM2 or Docker Compose in production
docker-compose up -d
```

---

## 🔍 TROUBLESHOOTING

### Twilio Not Calling

- Check webhook URL is public (not localhost)
- Verify phone number format (+countrycode...)
- Check Twilio console → Debugger for errors

### n8n Not Triggering

- Verify Google Calendar credentials
- Check calendar ID is correct
- Ensure workflow is activated
- Check event summary contains "HireReady – Phonic Mock Interview"

### Google Speech-to-Text Errors

- Verify service account has Speech API enabled
- Check service account JSON path
- Ensure project has billing enabled (free tier available)

### Calendar Event Not Creating

- Check service account has calendar access
- Share your calendar with service account email
- Verify calendar ID

---

## 📊 MONITORING

### View Active Calls

```bash
# Twilio Console → Monitor → Calls → Call Logs
```

### View n8n Executions

```bash
# n8n → Executions tab
```

### Backend Logs

```bash
# View logs
npm start

# Or if using PM2
pm2 logs hireready-backend
```

---

## 💰 COST ESTIMATION

### Free Tier Limits:
- **Twilio**: $15 credit (~500 minutes)
- **Google Calendar**: Unlimited
- **Google Speech-to-Text**: 60 minutes/month free
- **OpenAI GPT-4**: ~$0.03 per interview
- **n8n Cloud**: 5,000 executions/month free

### Estimated cost per interview: $0.10 - $0.50

---

## 📞 SUPPORT

Issues? Check:
1. Backend logs: `npm start` output
2. Twilio debugger: https://console.twilio.com/debugger
3. n8n execution logs
4. Google Cloud logs

---

## ✅ CHECKLIST

Before going live:

- [ ] Twilio account verified
- [ ] Phone number purchased
- [ ] Webhooks configured
- [ ] Google Calendar API enabled
- [ ] Service account created
- [ ] Calendar shared with service account
- [ ] n8n workflow imported and activated
- [ ] Backend deployed publicly
- [ ] Environment variables set
- [ ] Test call completed successfully

---

You're ready to go! 🎉
