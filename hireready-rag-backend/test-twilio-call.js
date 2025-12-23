import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

console.log("🧪 Testing Twilio Call...");
console.log(`From: ${process.env.TWILIO_PHONE_NUMBER}`);
console.log(`To: +919855022273`);

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

try {
  const call = await client.calls.create({
    to: "+919855022273",        // YOUR phone number
    from: process.env.TWILIO_PHONE_NUMBER,
    url: "https://demo.twilio.com/welcome/voice/"  // Twilio's demo voice
  });

  console.log("✅ Call initiated successfully!");
  console.log(`Call SID: ${call.sid}`);
  console.log(`Status: ${call.status}`);
  console.log("📞 CHECK YOUR PHONE NOW - it should ring!");
  console.log(`\n🔍 Check call logs: https://console.twilio.com/us1/monitor/logs/calls/${call.sid}`);
} catch (error) {
  console.error("❌ Call failed:", error.message);
  if (error.code === 21608) {
    console.log("\n⚠️  TRIAL ACCOUNT ISSUE:");
    console.log("Your phone number +919855022273 is NOT VERIFIED.");
    console.log("\n👉 Fix this:");
    console.log("1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified");
    console.log("2. Click 'Add a new Caller ID'");
    console.log("3. Enter: +919855022273");
    console.log("4. Verify via SMS/Call");
  }
}
