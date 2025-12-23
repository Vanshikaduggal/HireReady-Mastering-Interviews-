import express from "express";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * POST /phonic/initiate-call
 * Initiate browser-based call using Twilio Client
 */
router.post("/", async (req, res) => {
  try {
    const { userId, userName, interviewId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Client identity (must match frontend registration)
    const clientIdentity = `interviewee_${userId}`;

    console.log(`📞 Initiating browser call to: ${clientIdentity}`);
    console.log(`   Interview ID: ${interviewId}`);
    console.log(`   User: ${userName || "Unknown"}`);

    // Create call to browser client (NOT phone number!)
    // Use inline TwiML to keep call alive for 30 minutes
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hello! Welcome to HireReady AI Phone Interview. Your interview will begin shortly. Please stay on the line.</Say>
  <Pause length="1800"/>
</Response>`;

    const call = await client.calls.create({
      to: `client:${clientIdentity}`,  // Browser client, not phone!
      from: process.env.TWILIO_PHONE_NUMBER,
      twiml: twiml,
    });

    console.log(`✅ Call initiated: ${call.sid}`);
    console.log(`   Status: ${call.status}`);
    console.log(`   To: ${clientIdentity} (browser)`);

    res.json({
      success: true,
      message: "Interview call initiated",
      callSid: call.sid,
      status: call.status,
      clientIdentity,
    });

  } catch (error) {
    console.error("❌ Call initiation failed:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
