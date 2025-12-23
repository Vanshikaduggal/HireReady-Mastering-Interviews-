import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Phone, Calendar, Clock, Award, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

interface InterviewResult {
  interviewId: string;
  userId: string;
  phone: string;
  scheduledAt: string;
  completedAt: string;
  duration: number;
  transcript: {
    speaker: string;
    text: string;
    timestamp: string;
  }[];
  feedback: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    communicationQuality: string;
  };
  status: string;
}

export default function PhonicResultsPage() {
  const { interviewId } = useParams();
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, [interviewId]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`${API_URL}/phonic/results/${interviewId}`);
      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || "Failed to load results");
      }
    } catch (err) {
      setError("Failed to load interview results");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Interview results not found"}</AlertDescription>
        </Alert>
        <Button onClick={() => (window.location.href = "/dashboard")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Phone Interview Results</h1>
          <p className="text-gray-600 dark:text-gray-400">Interview ID: {interviewId}</p>
        </div>
        <Badge variant={result.status === "completed" ? "default" : "secondary"}>
          {result.status}
        </Badge>
      </div>

      {/* Interview Details */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Details</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{new Date(result.scheduledAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">{result.duration} minutes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{result.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-6 w-6" />
            Overall Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-6xl font-bold ${getScoreColor(result.feedback.score)}`}>
              {result.feedback.score}
              <span className="text-2xl">/100</span>
            </div>
            <p className="text-lg mt-2 text-gray-600 dark:text-gray-400">
              {result.feedback.communicationQuality}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <TrendingUp className="h-5 w-5" />
            Key Strengths
          </CardTitle>
          <CardDescription>What you did well</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.feedback.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Areas for Improvement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            Areas for Improvement
          </CardTitle>
          <CardDescription>Focus on these to improve</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.feedback.weaknesses.map((weakness, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">⚠</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
          <CardDescription>Action items to boost your performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {result.feedback.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <span className="text-blue-500 font-bold mt-0.5">{index + 1}.</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Transcript */}
      <Card>
        <CardHeader>
          <CardTitle>Full Transcript</CardTitle>
          <CardDescription>Complete conversation recording</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-h-96 overflow-y-auto">
          {result.transcript.map((item, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg ${
                item.speaker === "ai"
                  ? "bg-gray-100 dark:bg-gray-800"
                  : "bg-blue-50 dark:bg-blue-950"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm">
                  {item.speaker === "ai" ? "AI Interviewer" : "You"}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm">{item.text}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={() => window.print()} variant="outline" className="flex-1">
          Print Results
        </Button>
        <Button onClick={() => (window.location.href = "/phonic-schedule")} className="flex-1">
          Schedule Another Interview
        </Button>
      </div>
    </div>
  );
}
