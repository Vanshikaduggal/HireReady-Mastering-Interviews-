# 📞 CREDENTIALS CHECKLIST

Copy this and fill in your credentials:

---

## 🔑 TWILIO

```
Account SID: AC________________________________
Auth Token:  ________________________________
Phone Number: +__________________________
```

Get from: https://console.twilio.com

---

## 🗓️ GOOGLE CALENDAR

```
Calendar ID: ________________________________@gmail.com
Service Account Email: ________________________________@your-project.iam.gserviceaccount.com
Service Account JSON: [ ] Downloaded and placed in hireready-rag-backend/
```

Get from: https://console.cloud.google.com

---

## 🤖 n8n

```
Instance URL: https://________________________________
[ ] Workflow imported
[ ] Google Calendar credential added
[ ] Twilio credential added
[ ] OpenAI credential added
[ ] Environment variables set
[ ] Workflow activated
```

Get from: https://n8n.io/cloud or `http://localhost:5678`

---

## 🧠 OPENAI

```
API Key: sk-________________________________
```

Get from: https://platform.openai.com/api-keys

---

## 🌐 DEPLOYMENT URLS

```
Backend URL (for Twilio): https://________________________________
Frontend URL: https://________________________________
n8n Webhook URL: https://________________________________
```

For local testing, use ngrok:
```bash
ngrok http 5000
# Copy the https URL
```

---

## ✅ VERIFICATION CHECKLIST

Backend:
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created with all credentials
- [ ] Service account JSON placed
- [ ] Backend starts without errors (`npm start`)

Twilio:
- [ ] Phone number purchased
- [ ] Voice webhook configured
- [ ] Status webhook configured
- [ ] Test call successful

Google Calendar:
- [ ] Calendar API enabled
- [ ] Speech-to-Text API enabled
- [ ] Service account created
- [ ] Calendar shared with service account email

n8n:
- [ ] Workflow imported
- [ ] All credentials added
- [ ] Environment variables set
- [ ] Workflow activated
- [ ] Test execution successful

Frontend:
- [ ] Routes added to App.tsx
- [ ] Components created
- [ ] Backend URL configured
- [ ] Can access scheduling page

---

## 🧪 TEST SEQUENCE

1. **Backend Health Check**
   ```bash
   curl http://localhost:5000
   # Should return: {"message": "🚀 RAG Mentor API is running!"}
   ```

2. **Schedule Test Interview**
   - Go to: http://localhost:5173/generate/phonic-schedule
   - Fill in details for 2 minutes from now
   - Check Google Calendar - event should appear

3. **Wait for n8n Trigger**
   - Open n8n Executions tab
   - Should see execution start at scheduled time

4. **Receive Call**
   - Your phone should ring
   - Answer and interact with AI
   - Complete the interview

5. **Check Results**
   - Go to: http://localhost:5173/generate/phonic-results/[interview-id]
   - Should see transcript and feedback

---

## 🐛 COMMON ISSUES & FIXES

| Issue | Fix |
|-------|-----|
| Backend can't find service account JSON | Check file path in `.env` matches actual location |
| Twilio "Webhook URL not responding" | Make sure backend is public (use ngrok for local) |
| n8n not triggering | Verify calendar event summary contains exact text |
| Call connects but no speech recognized | Check Twilio console → Speech Recognition settings |
| Google API quota exceeded | Enable billing or wait 24 hours |
| No feedback generated | Check OpenAI API key and quota |

---

## 📞 SUPPORT RESOURCES

- **Twilio Docs**: https://www.twilio.com/docs/voice
- **Google Calendar API**: https://developers.google.com/calendar
- **n8n Docs**: https://docs.n8n.io
- **Google Speech-to-Text**: https://cloud.google.com/speech-to-text/docs

---

**Print this and check off items as you complete them! ✅**
