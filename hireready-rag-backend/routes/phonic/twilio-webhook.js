import express from "express";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// Store active interview sessions in memory (use Redis in production)
const activeSessions = new Map();

/**
 * POST /phonic/webhook/voice
 * Twilio voice webhook - handles incoming call flow
 */
router.post("/voice", async (req, res) => {
  try {
    const { CallSid, From } = req.body;
    
    console.log(`📞 Incoming call: ${CallSid} from ${From}`);

    const twiml = new VoiceResponse();

    // Initialize session
    if (!activeSessions.has(CallSid)) {
      activeSessions.set(CallSid, {
        callSid: CallSid,
        phone: From,
        transcript: [],
        questionCount: 0,
        startedAt: new Date().toISOString(),
      });

      // Greeting
      twiml.say({
        voice: "Polly.Joanna",
        language: "en-US"
      }, "Hello! Welcome to HireReady AI Phone Interview. This is an automated mock interview to help you practice. Let's begin.");

      twiml.pause({ length: 1 });

      // First question
      twiml.say({
        voice: "Polly.Joanna"
      }, "Tell me about yourself and your background.");

      // Gather user response
      const gather = twiml.gather({
        input: "speech",
        timeout: 30,
        speechTimeout: "auto",
        action: "/phonic/webhook/process-answer",
        method: "POST",
      });

    } else {
      twiml.say("Please continue with your answer.");
    }

    res.type("text/xml");
    res.send(twiml.toString());

  } catch (error) {
    console.error("❌ Voice webhook error:", error);
    const twiml = new VoiceResponse();
    twiml.say("Sorry, there was an error. Please try again later.");
    twiml.hangup();
    res.type("text/xml");
    res.send(twiml.toString());
  }
});

/**
 * POST /phonic/webhook/process-answer
 * Process user's speech input and generate next question
 */
router.post("/process-answer", async (req, res) => {
  try {
    const { CallSid, SpeechResult, Confidence } = req.body;

    console.log(`💬 Speech received (confidence: ${Confidence}): ${SpeechResult}`);

    const session = activeSessions.get(CallSid);
    
    if (!session) {
      const twiml = new VoiceResponse();
      twiml.say("Session expired. Please call again.");
      twiml.hangup();
      res.type("text/xml");
      return res.send(twiml.toString());
    }

    // Save transcript
    session.transcript.push({
      speaker: "user",
      text: SpeechResult,
      confidence: Confidence,
      timestamp: new Date().toISOString(),
    });

    session.questionCount++;

    // Prepare for next question
    const twiml = new VoiceResponse();

    // Acknowledgment
    const acknowledgments = [
      "Thank you for sharing that.",
      "I see. That's helpful.",
      "Interesting. Let me ask you another question.",
      "Good. Moving on to the next question.",
    ];
    
    const ack = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
    twiml.say({ voice: "Polly.Joanna" }, ack);
    twiml.pause({ length: 1 });

    // Check if we should end interview
    if (session.questionCount >= 5) {
      twiml.say({
        voice: "Polly.Joanna"
      }, "Thank you for completing the mock interview. Your performance has been recorded and you'll receive detailed feedback shortly. Have a great day!");
      
      twiml.hangup();

      // Save final transcript (would send to n8n or save to Firebase)
      console.log(`✅ Interview completed for ${CallSid}`);
      console.log(`📝 Transcript:`, session.transcript);

      // Clean up
      activeSessions.delete(CallSid);

    } else {
      // Ask next question (this would be GPT-generated in full implementation)
      const questions = [
        "What are your key technical strengths?",
        "Describe a challenging project you worked on and how you handled it.",
        "What technologies are you most comfortable with?",
        "Where do you see yourself in the next two years?",
        "Why are you interested in this role?",
      ];

      const nextQuestion = questions[session.questionCount];
      
      twiml.say({ voice: "Polly.Joanna" }, nextQuestion);

      session.transcript.push({
        speaker: "ai",
        text: nextQuestion,
        timestamp: new Date().toISOString(),
      });

      // Gather next response
      twiml.gather({
        input: "speech",
        timeout: 30,
        speechTimeout: "auto",
        action: "/phonic/webhook/process-answer",
        method: "POST",
      });
    }

    res.type("text/xml");
    res.send(twiml.toString());

  } catch (error) {
    console.error("❌ Process answer error:", error);
    const twiml = new VoiceResponse();
    twiml.say("Sorry, I couldn't process that. Could you please repeat?");
    twiml.hangup();
    res.type("text/xml");
    res.send(twiml.toString());
  }
});

/**
 * POST /phonic/webhook/status
 * Call status callback
 */
router.post("/status", async (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;
  
  console.log(`📊 Call status update: ${CallSid} - ${CallStatus}`);
  
  if (CallStatus === "completed") {
    console.log(`   Duration: ${CallDuration} seconds`);
    
    // Clean up session if exists
    if (activeSessions.has(CallSid)) {
      const session = activeSessions.get(CallSid);
      console.log(`   Questions asked: ${session.questionCount}`);
      activeSessions.delete(CallSid);
    }
  }

  res.sendStatus(200);
});

/**
 * POST /phonic/webhook/google-stt
 * Google Speech-to-Text webhook (alternative to Twilio STT)
 */
router.post("/google-stt", async (req, res) => {
  try {
    const { audioUrl, callSid } = req.body;

    // This would integrate with Google Speech-to-Text API
    // For now, returning placeholder
    
    console.log(`🎤 Processing audio with Google STT: ${audioUrl}`);

    // Import Google Speech client
    // const speech = require('@google-cloud/speech');
    // const client = new speech.SpeechClient();
    // ... process audio ...

    res.json({
      success: true,
      transcript: "Placeholder transcript from Google STT",
      confidence: 0.95,
    });

  } catch (error) {
    console.error("❌ Google STT error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
