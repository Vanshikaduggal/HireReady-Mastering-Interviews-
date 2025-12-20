import { useState } from "react";
import { Calendar, Clock, Phone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useUser } from "@clerk/clerk-react";

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

  // Get user's phone number from Clerk
  const userPhone = user?.primaryPhoneNumber?.phoneNumber || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userPhone) {
      toast.error("Phone number required", {
        description: "Please add a phone number to your account first.",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/phonic/schedule/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.fullName,
          userPhone: userPhone,
          scheduledDate: formData.scheduledDate,
          scheduledTime: formData.scheduledTime,
          duration: formData.duration,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setScheduled(true);
        toast.success("Interview Scheduled! 📞", {
          description: `Your AI phone interview is scheduled for ${formData.scheduledDate} at ${formData.scheduledTime}`,
        });
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
            <CardDescription>Get ready for your AI phone interview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>What happens next:</strong>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>You'll receive a call at {userPhone} at the scheduled time</li>
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
                  <span>Time: {formData.scheduledTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>Phone: {userPhone}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setScheduled(false)} variant="outline" className="flex-1">
                Schedule Another
              </Button>
              <Button onClick={() => (window.location.href = "/dashboard")} className="flex-1">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-6 w-6" />
            Schedule AI Phone Interview
          </CardTitle>
          <CardDescription>
            Book a time for an AI-powered mock phone interview. Perfect for practicing communication
            skills and getting comfortable with phone interviews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Display */}
            <div>
              <Label>Your Phone Number</Label>
              <div className="flex items-center gap-2 mt-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {userPhone || "No phone number on file"}
                </span>
              </div>
              {!userPhone && (
                <p className="text-sm text-red-500 mt-1">
                  Please add a phone number to your Clerk account first
                </p>
              )}
            </div>

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
              <Label htmlFor="time">Interview Time</Label>
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
                  <li>AI will call you at the scheduled time</li>
                  <li>You'll answer typical interview questions</li>
                  <li>Your responses are analyzed for feedback</li>
                  <li>Receive detailed performance report</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading || !userPhone}>
              {loading ? "Scheduling..." : "Schedule Phone Interview 📞"}
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
          <p>✓ Find a quiet place with good phone reception</p>
          <p>✓ Have your resume handy for reference</p>
          <p>✓ Speak clearly and at a moderate pace</p>
          <p>✓ Take your time to think before answering</p>
          <p>✓ Be professional as if it's a real interview</p>
        </CardContent>
      </Card>
    </div>
  );
}
