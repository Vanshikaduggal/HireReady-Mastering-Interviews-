import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoute from "./routes/chat.js";
import phonicCalendarRoute from "./routes/phonic/calendar.js";
import phonicTwilioRoute from "./routes/phonic/twilio-webhook.js";
import phonicFeedbackRoute from "./routes/phonic/feedback.js";
import phonicTokenRoute from "./routes/phonic/token.js";
import phonicCallRoute from "./routes/phonic/initiate-call.js";
import { startCalendarScheduler } from "./services/calendar-scheduler.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For Twilio webhooks

// Routes
app.use("/chat", chatRoute);
app.use("/phonic/schedule", phonicCalendarRoute);
app.use("/phonic/webhook", phonicTwilioRoute);
app.use("/phonic/feedback", phonicFeedbackRoute);
app.use("/phonic/token", phonicTokenRoute);
app.use("/phonic/initiate-call", phonicCallRoute);

app.get("/", (req, res) => {
  res.json({ 
    message: "🚀 RAG Mentor API is running!",
    endpoints: {
      chat: "/chat",
      phonicScheduling: "/phonic/schedule",
      phonicWebhooks: "/phonic/webhook",
      phonicFeedback: "/phonic/feedback",
      phonicToken: "/phonic/token",
      phonicCall: "/phonic/initiate-call"
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 RAG server running on http://localhost:${PORT}`);
  console.log(`📞 Phonic interview endpoints ready`);
  console.log(`🧠 Using Gemini for AI feedback (FREE!)`);
  console.log(`🌐 Browser-based calls enabled (Twilio Client SDK)`);
  console.log(`📅 Calendar scheduler enabled (NO n8n REQUIRED!)`);
  
  // Start calendar scheduler
  startCalendarScheduler();
});
