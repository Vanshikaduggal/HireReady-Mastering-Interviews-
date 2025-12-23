import { google } from "googleapis";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const calendar = google.calendar("v3");
const oauth2Client = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Track processed events
const processedEvents = new Set();

/**
 * Poll Google Calendar for upcoming interviews
 */
async function pollCalendar() {
  try {
    const auth = await oauth2Client.getClient();
    
    // Get events in the next 5 minutes
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    const response = await calendar.events.list({
      auth,
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      timeMin: now.toISOString(),
      timeMax: fiveMinutesFromNow.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];
    
    for (const event of events) {
      // Check if event is a HireReady interview
      if (!event.description?.includes("[HIREREADY_INTERVIEW]")) {
        continue;
      }

      // Check if already processed
      if (event.description?.includes("[HIREREADY_PROCESSED]")) {
        continue;
      }

      // Check if already processed in this session
      if (processedEvents.has(event.id)) {
        continue;
      }

      // Check if event starts within 2 minutes
      const startTime = new Date(event.start.dateTime);
      const timeUntilStart = startTime.getTime() - now.getTime();
      
      if (timeUntilStart > 2 * 60 * 1000) {
        // Event is more than 2 minutes away
        continue;
      }

      if (timeUntilStart < -5 * 60 * 1000) {
        // Event started more than 5 minutes ago
        continue;
      }

      console.log(`🎯 Found interview starting soon: ${event.summary}`);
      
      // Extract userId and userName from description
      const userIdMatch = event.description.match(/User ID:\s*([^\n]+)/);
      const userNameMatch = event.description.match(/User:\s*([^\n]+)/);
      
      const userId = userIdMatch ? userIdMatch[1].trim() : null;
      const userName = userNameMatch ? userNameMatch[1].trim() : null;

      if (!userId) {
        console.error(`❌ No userId found in event: ${event.id}`);
        continue;
      }

      // Mark as processed in memory
      processedEvents.add(event.id);

      // Initiate the call
      await initiateInterviewCall({
        eventId: event.id,
        userId,
        userName,
      });

      // Mark event as processed in Google Calendar
      await markEventAsProcessed(auth, event);
      
    }
  } catch (error) {
    console.error("❌ Calendar polling error:", error.message);
  }
}

/**
 * Initiate browser call to user
 */
async function initiateInterviewCall({ eventId, userId, userName }) {
  try {
    const clientIdentity = `interviewee_${userId}`;

    console.log(`📞 Initiating browser call to: ${clientIdentity}`);
    console.log(`   Event ID: ${eventId}`);
    console.log(`   User: ${userName || "Unknown"}`);

    // For browser calls, provide TwiML that keeps call alive for interview
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hello! Welcome to HireReady AI Phone Interview. Your interview will begin shortly. Please stay on the line.</Say>
  <Pause length="1800"/>
</Response>`;

    const call = await twilioClient.calls.create({
      to: `client:${clientIdentity}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      twiml: twiml,  // Use inline TwiML that keeps call alive for 30 minutes
    });

    console.log(`✅ Call initiated: ${call.sid}`);
    console.log(`   Status: ${call.status}`);

    return call;
  } catch (error) {
    console.error(`❌ Failed to initiate call:`, error.message);
    throw error;
  }
}

/**
 * Mark calendar event as processed
 */
async function markEventAsProcessed(auth, event) {
  try {
    await calendar.events.patch({
      auth,
      calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
      eventId: event.id,
      requestBody: {
        description: `${event.description}\n[HIREREADY_PROCESSED]`,
      },
    });

    console.log(`✅ Event marked as processed: ${event.id}`);
  } catch (error) {
    console.error(`❌ Failed to mark event as processed:`, error.message);
  }
}

/**
 * Start the calendar scheduler
 */
export function startCalendarScheduler() {
  console.log("📅 Starting calendar scheduler...");
  console.log("   Polling every 30 seconds");
  
  // Poll immediately
  pollCalendar();
  
  // Poll every 30 seconds
  setInterval(pollCalendar, 30 * 1000);
}

export default { startCalendarScheduler };
