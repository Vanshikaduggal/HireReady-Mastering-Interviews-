import { useState, useEffect } from "react";
import { Calendar, Clock, Phone, Info, Globe, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function PhonicSchedulePage() {
  const { user } = useUser();

  const [formData, setFormData] = useState({
    scheduledDate: "",
    scheduledTime: "",
    duration: 15,
  });

  const [loading, setLoading] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [scheduledInterviews, setScheduledInterviews] = useState<any[]>([]);

  // Fetch scheduled interviews
  useEffect(() => {
    if (user?.id) {
      fetchScheduledInterviews();
    }
  }, [user]);

  const fetchScheduledInterviews = async () => {
    try {
      const response = await fetch(`${API_URL}/phonic/schedule/upcoming/${user?.id}`);
      const data = await response.json();
      if (data.success) {
        setScheduledInterviews(data.interviews || []);
      }
    } catch (error) {
      console.error("Failed to fetch interviews:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // CHANGE #4: Block scheduling past times
    const selectedDateTime = new Date(
      `${formData.scheduledDate}T${formData.scheduledTime}:00`
    );

    if (selectedDateTime.getTime() < Date.now() + 2 * 60 * 1000) {
      toast.error("Please select a time at least 2 minutes in the future");
      return;
    }

    setLoading(true);

    try {
      // Convert to ISO format (backend expects scheduledAt)
      const scheduledAt = selectedDateTime.toISOString();

      const response = await fetch(`${API_URL}/phonic/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id, // CHANGE #3: Clerk User ID (source of truth)
          userName: user?.fullName,
          userPhone: "browser", // Browser-based call
          scheduledAt, // ISO format
          timezone: "Asia/Kolkata", // CHANGE #2: Explicit timezone
          duration: formData.duration,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setScheduled(true);
        fetchScheduledInterviews(); // Refresh list
        
        toast.success("Interview Scheduled! 📞", {
          description: "Open the Join Call page at least 2 minutes before time",
        });

        // CHANGE #1: AUTO REDIRECT AFTER 5 SECONDS
        setTimeout(() => {
          window.location.href = "/generate/phone-client";
        }, 5000);
      } else {
        throw new Error(data.error || "Failed to schedule interview");
      }
    } catch (error) {
      console.error("Scheduling error:", error);
      toast.error("Scheduling Failed", {
        description: error instanceof Error ? error.message : "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (scheduled) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-green-600">✅ Interview Scheduled Successfully!</CardTitle>
            <CardDescription>Get ready for your AI browser interview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-300">
              <Globe className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong className="text-blue-800">🌐 Browser-Based Interview:</strong>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Open the <Link to="/generate/phone-client" className="underline font-semibold">Join Call</Link> page before your scheduled time</li>
                  <li>The call will come directly to your browser (no phone needed!)</li>
                  <li>Click "Accept" when you see the incoming call notification</li>
                  <li>The AI interviewer will conduct a 15-minute mock interview</li>
                  <li>Your responses will be recorded and analyzed</li>
                  <li>You'll receive detailed feedback within minutes</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Interview Details:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Date: {formData.scheduledDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Time: {formData.scheduledTime} (IST)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Type: Browser Call</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setScheduled(false)} variant="outline" className="flex-1">
                Schedule Another
              </Button>
              <Link to="/generate/phone-client" className="flex-1">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  🔔 Join Call Page (Open Before Interview)
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduling Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-blue-600" />
                Schedule AI Browser Interview
              </CardTitle>
              <CardDescription>
                Book a time for an AI-powered mock interview. The call will come directly to your browser - no phone needed!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Browser-Based Info */}
                <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-300">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <strong className="text-blue-800">🚀 Currently Testing:</strong>
                    <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                      <li>Browser-based calls using Twilio Client SDK</li>
                      <li>No phone number verification needed</li>
                      <li>Works with trial credits (completely free!)</li>
                      <li>Same AI interview experience as phone calls</li>
                      <li>Perfect for testing before launch</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* Date Selection */}
                <div>
                  <Label htmlFor="date">Interview Date</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <Input
                      id="date"
                      type="date"
                      min={getTodayDate()}
                      value={formData.scheduledDate}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduledDate: e.target.value })
                      }
                      required
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <Label htmlFor="time">Interview Time (IST)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <Input
                      id="time"
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduledTime: e.target.value })
                      }
                      required
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="10"
                    max="30"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>

                {/* Info Alert */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>How it works:</strong>
                    <ul className="list-disc ml-6 mt-2 space-y-1 text-sm">
                      <li>Open the "Join Call" page before your scheduled time</li>
                      <li>AI will call your browser at the scheduled time</li>
                      <li>You'll answer typical interview questions</li>
                      <li>Your responses are analyzed for feedback</li>
                      <li>Receive detailed performance report</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* Submit Button */}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Scheduling..." : "Schedule Browser Interview 🌐"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="mt-6 bg-blue-50 dark:bg-blue-950 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">💡 Tips for Success</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>✓ Keep the "Join Call" tab open during scheduled time</p>
              <p>✓ Grant microphone permissions when prompted</p>
              <p>✓ Use headphones for best audio quality</p>
              <p>✓ Find a quiet place with good internet connection</p>
              <p>✓ Have your resume handy for reference</p>
              <p>✓ Speak clearly and at a moderate pace</p>
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Interviews Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📅 Scheduled Interviews</CardTitle>
              <CardDescription>Your upcoming browser interviews</CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledInterviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No scheduled interviews yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scheduledInterviews.map((interview, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3" />
                            <span className="font-medium">
                              {new Date(interview.scheduledAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(interview.scheduledAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <Globe className="h-3 w-3" />
                            <span>Browser Call</span>
                          </div>
                        </div>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          Scheduled
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link to="/generate/phone-client" className="block mt-4">
                <Button className="w-full" variant="outline">
                  <Globe className="h-4 w-4 mr-2" />
                  🔔 Open Join Call Page
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
