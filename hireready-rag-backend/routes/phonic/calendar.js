import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Initialize Google Calendar API
const calendar = google.calendar("v3");

// OAuth2 client setup
const oauth2Client = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

/**
 * POST /phonic/schedule
 * Schedule a phonic interview
 */
router.post("/", async (req, res) => {
  try {
    const { userId, userName, userPhone, scheduledAt, timezone = "Asia/Kolkata", duration = 15 } = req.body;

    // Validation
    if (!userId || !userPhone || !scheduledAt) {
      return res.status(400).json({ 
        error: "Missing required fields: userId, userPhone, scheduledAt" 
      });
    }

    // Safe Date calculation (no manual IST math)
    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    console.log(`📅 Scheduling phonic interview for ${userName || userPhone}`);
    console.log(`   Start: ${start.toISOString()}`);
    console.log(`   End: ${end.toISOString()}`);
    console.log(`   Timezone: ${timezone}`);

    // Create Google Calendar event
    const auth = await oauth2Client.getClient();
    
    const event = {
      summary: `[PHONIC] HireReady – Phonic Mock Interview (${userName || "User"})`,
      description: `[HIREREADY_INTERVIEW]\nAI-powered phone interview\nUser: ${userName || "N/A"}\nPhone: ${userPhone}\nUser ID: ${userId}\nType: PHONIC_INTERVIEW`,
      start: {
        dateTime: start.toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: timezone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 10 },
        ],
      },
      // Store metadata in extended properties
      extendedProperties: {
        private: {
          userId,
          userPhone,
          interviewType: "phonic",
          status: "scheduled",
        },
      },
    };

    const calendarResponse = await calendar.events.insert({
      auth,
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      requestBody: event,
    });

    const calendarEventId = calendarResponse.data.id;
    console.log(`✅ Calendar event created: ${calendarEventId}`);

    // Prepare response
    const interviewData = {
      interviewId: `phonic_${Date.now()}`,
      calendarEventId,
      userId,
      userPhone,
      userName: userName || null,
      scheduledAt: start.toISOString(),
      duration,
      status: "scheduled",
      createdAt: new Date().toISOString(),
    };

    // Here you would typically save to Firebase
    // For now, we'll return the data
    console.log(`📞 Phonic interview scheduled successfully`);

    res.json({
      success: true,
      message: "Phonic interview scheduled successfully",
      data: interviewData,
      calendarLink: calendarResponse.data.htmlLink,
    });

  } catch (error) {
    console.error("❌ Error scheduling phonic interview:", error);
    res.status(500).json({ 
      error: "Failed to schedule interview",
      details: error.message 
    });
  }
});

/**
 * GET /phonic/upcoming
 * Get upcoming phonic interviews for a user
 */
router.get("/upcoming/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const auth = await oauth2Client.getClient();
    
    // Get events from now onwards
    const now = new Date();
    const response = await calendar.events.list({
      auth,
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      timeMin: now.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
      q: "HireReady – Phonic Mock Interview",
    });

    // Filter events for this user
    const userEvents = response.data.items.filter(event => 
      event.extendedProperties?.private?.userId === userId
    );

    const interviews = userEvents.map(event => ({
      interviewId: event.id,
      calendarEventId: event.id,
      scheduledAt: event.start.dateTime,
      status: event.extendedProperties?.private?.status || "scheduled",
      calendarLink: event.htmlLink,
    }));

    res.json({
      success: true,
      count: interviews.length,
      interviews,
    });

  } catch (error) {
    console.error("❌ Error fetching upcoming interviews:", error);
    res.status(500).json({ 
      error: "Failed to fetch interviews",
      details: error.message 
    });
  }
});

/**
 * DELETE /phonic/cancel/:eventId
 * Cancel a scheduled interview
 */
router.delete("/cancel/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    const auth = await oauth2Client.getClient();
    
    await calendar.events.delete({
      auth,
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      eventId,
    });

    console.log(`❌ Interview cancelled: ${eventId}`);

    res.json({
      success: true,
      message: "Interview cancelled successfully",
    });

  } catch (error) {
    console.error("❌ Error cancelling interview:", error);
    res.status(500).json({ 
      error: "Failed to cancel interview",
      details: error.message 
    });
  }
});

export default router;
