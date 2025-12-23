import express from "express";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;

/**
 * POST /phonic/token
 * Generate Twilio Access Token for browser-based calls
 */
router.post("/generate", async (req, res) => {
  try {
    const { userId, userName } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Create client identity (unique per user)
    const identity = `interviewee_${userId}`;

    console.log(`🔑 Generating Twilio token for: ${identity}`);

    // Validate API credentials
    if (!apiKey || !apiSecret) {
      throw new Error("TWILIO_API_KEY and TWILIO_API_SECRET are required. Create an API Key at https://console.twilio.com/us1/account/keys-credentials/api-keys");
    }

    // Create Access Token
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const token = new AccessToken(
      accountSid,
      apiKey,      // API Key SID (starts with SK...)
      apiSecret,   // API Key Secret
      { identity: identity, ttl: 3600 } // Valid for 1 hour
    );

    // Grant voice permissions
    const voiceGrant = new VoiceGrant({
      incomingAllow: true, // Allow incoming calls
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID || undefined,
    });

    token.addGrant(voiceGrant);

    console.log(`✅ Token generated for ${userName || identity}`);

    res.json({
      success: true,
      token: token.toJwt(),
      identity: identity,
    });
  } catch (error) {
    console.error("❌ Token generation failed:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
