import express from "express";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// Track active calls (minimal metadata only)
const activeCalls = new Map();

/**
 * POST /phonic/webhook/voice
 * Twilio voice webhook - MINIMAL for browser calls
 * 
 * ⚠️ IMPORTANT: For Twilio Client (browser calls):
 * - TwiML + Gather does NOT work
 * - Speech recognition NOT triggered
 * - Interview logic runs in BROWSER, not here
 * - This webhook is ONLY for call lifecycle logging
 */
router.post("/voice", async (req, res) => {
  try {
    const { CallSid, From } = req.body;
    
    console.log(`📞 Browser call connected: ${CallSid} from ${From}`);

    // Track call start time (minimal metadata)
    activeCalls.set(CallSid, { 
      startedAt: Date.now(),
      from: From 
    });

    const twiml = new VoiceResponse();
    
    // Simple greeting - interview logic runs in browser
    twiml.say({
      voice: "Polly.Joanna",
      language: "en-US"
    }, "Connecting your interview. Please wait.");

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
 * POST /phonic/webhook/status
 * Call status callback - for lifecycle logging only
 */
router.post("/status", async (req, res) => {
  const { CallSid, CallStatus, CallDuration } = req.body;
  
  console.log(`📊 Call status update: ${CallSid} - ${CallStatus}`);
  
  if (CallStatus === "completed") {
    console.log(`   Duration: ${CallDuration} seconds`);
    
    // Clean up call tracking
    if (activeCalls.has(CallSid)) {
      const call = activeCalls.get(CallSid);
      const durationMs = Date.now() - call.startedAt;
      console.log(`   Call duration: ${Math.floor(durationMs / 1000)}s`);
      activeCalls.delete(CallSid);
    }
  }

  res.sendStatus(200);
});

export default router;
