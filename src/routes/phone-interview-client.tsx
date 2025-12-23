import { useEffect, useState } from "react";
import { Device, Call as TwilioCall } from "@twilio/voice-sdk";
import { useUser } from "@clerk/clerk-react";
import { Phone, PhoneOff, PhoneMissed, Loader2, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function PhoneInterviewClient() {
  const { user } = useUser();
  const [device, setDevice] = useState<Device | null>(null);
  const [call, setCall] = useState<TwilioCall | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "ringing" | "active" | "ended">("idle");
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize Twilio Device
  useEffect(() => {
    if (!user) return;

    const initDevice = async () => {
      try {
        // FIX #4: Force microphone permission BEFORE anything else
        console.log("🎤 Requesting microphone permission...");
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("✅ Microphone permission granted");

        console.log("🔑 Requesting Twilio access token...");
        console.log("   Using Clerk User ID:", user.id); // CRITICAL: Log the exact ID
        
        const response = await fetch(`${API_URL}/phonic/token/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id, // FIX #1: Use Clerk user.id (source of truth)
            userName: user.firstName || user.username,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to get token");
        }

        console.log("✅ Token received");
        console.log("   Identity:", data.identity); // Should be: interviewee_<clerk_user_id>

        // Create Twilio Device
        const twilioDevice = new Device(data.token, {
          logLevel: 1, // Debug logs
        });

        // Device event listeners
        twilioDevice.on("registered", () => {
          console.log("📱 Twilio Device registered successfully");
          console.log("   Listening as:", data.identity);
          setStatus("idle");
          setLoading(false);
          toast.success("Ready to receive calls", {
            description: "Your browser is now connected to Twilio",
          });
        });

        twilioDevice.on("incoming", (incomingCall) => {
          console.log("📞 INCOMING CALL RECEIVED!");
          console.log("   Call SID:", incomingCall.parameters.CallSid);
          
          setCall(incomingCall);
          setStatus("ringing");
          
          // FIX #3: AUTO-ACCEPT for testing (remove in production)
          console.log("🚀 Auto-accepting call for testing...");
          incomingCall.accept();
          setStatus("active");
          
          toast.info("Incoming Interview Call! 📞", {
            description: "Auto-accepted - Interview starting now",
            duration: 5000,
          });

          // Call event listeners
          incomingCall.on("accept", () => {
            console.log("✅ Call accepted and active");
            setStatus("active");
            toast.success("Interview Started", {
              description: "Speak clearly and answer the questions",
            });
          });

          incomingCall.on("disconnect", () => {
            console.log("📴 Call ended");
            setStatus("ended");
            setCall(null);
            toast.info("Interview Ended", {
              description: "Your responses have been recorded",
            });
          });

          incomingCall.on("reject", () => {
            console.log("❌ Call rejected");
            setStatus("idle");
            setCall(null);
          });

          incomingCall.on("error", (error: Error) => {
            console.error("❌ Call error:", error);
            toast.error("Call Error", {
              description: error.message,
            });
          });
        });

        twilioDevice.on("error", (error) => {
          console.error("❌ Twilio Device error:", error);
          toast.error("Device Error", {
            description: error.message,
          });
        });

        // Register device
        console.log("📡 Registering Twilio Device...");
        await twilioDevice.register();
        setDevice(twilioDevice);

      } catch (error) {
        console.error("❌ Device initialization failed:", error);
        setLoading(false);
        toast.error("Setup Failed", {
          description: error instanceof Error ? error.message : "Could not connect to Twilio",
        });
      }
    };

    initDevice();

    // Cleanup
    return () => {
      if (device) {
        console.log("🧹 Cleaning up Twilio Device");
        device.destroy();
      }
    };
  }, [user]); // Only depend on user, not device (prevents infinite loop)

  // Accept incoming call
  const acceptCall = () => {
    if (call) {
      call.accept();
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (call) {
      call.reject();
      setStatus("idle");
      setCall(null);
    }
  };

  // End active call
  const endCall = () => {
    if (call) {
      call.disconnect();
      setStatus("idle");
      setCall(null);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (call) {
      call.mute(!muted);
      setMuted(!muted);
      toast.info(muted ? "Microphone Unmuted" : "Microphone Muted");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-lg text-gray-600">Connecting to Twilio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="p-8">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">📞 Phone Interview</h1>
          
          {status === "idle" && (
            <div className="space-y-4">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Phone className="w-12 h-12 text-green-600" />
              </div>
              <p className="text-xl font-semibold text-green-600">Ready to Receive Calls</p>
              <p className="text-gray-600">
                Keep this tab open. When your scheduled interview time arrives,
                you'll receive an incoming call right here in your browser.
              </p>
            </div>
          )}

          {status === "ringing" && (
            <div className="space-y-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <Phone className="w-12 h-12 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">📞 Incoming Call!</p>
              <p className="text-lg text-gray-700">Your HireReady Interview is starting</p>
              
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={acceptCall}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Accept
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={rejectCall}
                >
                  <PhoneOff className="w-5 h-5 mr-2" />
                  Decline
                </Button>
              </div>
            </div>
          )}

          {status === "active" && (
            <div className="space-y-6">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Phone className="w-12 h-12 text-white animate-pulse" />
              </div>
              <p className="text-2xl font-bold text-blue-600">🎙️ Interview in Progress</p>
              <p className="text-lg text-gray-700">Speak clearly and answer the questions</p>
              
              <div className="flex gap-4 justify-center">
                <Button
                  size="lg"
                  variant={muted ? "default" : "secondary"}
                  onClick={toggleMute}
                >
                  {muted ? (
                    <><MicOff className="w-5 h-5 mr-2" /> Unmute</>
                  ) : (
                    <><Mic className="w-5 h-5 mr-2" /> Mute</>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={endCall}
                >
                  <PhoneOff className="w-5 h-5 mr-2" />
                  End Call
                </Button>
              </div>
            </div>
          )}

          {status === "ended" && (
            <div className="space-y-4">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <PhoneMissed className="w-12 h-12 text-gray-600" />
              </div>
              <p className="text-xl font-semibold text-gray-600">Call Ended</p>
              <p className="text-gray-600">
                Your interview has been recorded. Check your dashboard for results.
              </p>
              <Button onClick={() => window.location.href = "/dashboard"}>
                Go to Dashboard
              </Button>
            </div>
          )}

          {status === "idle" && (
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">💡 Tips:</p>
              <ul className="text-sm text-blue-700 text-left mt-2 space-y-1">
                <li>• Grant microphone permissions when prompted</li>
                <li>• Use headphones for best audio quality</li>
                <li>• Keep this tab open during scheduled time</li>
                <li>• Speak clearly and pause between answers</li>
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
