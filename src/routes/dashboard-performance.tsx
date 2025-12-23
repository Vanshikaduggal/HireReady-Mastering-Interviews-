import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { Interview, UserAnswer } from "@/types";
import { LoaderPage } from "./loader-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, TrendingUp, Target, Clock, BarChart3 } from "lucide-react";
import { CustomBreadCrumb } from "@/components/custom-bread-crumb";
import { InterviewPin } from "@/components/pin";
import { Separator } from "@/components/ui/separator";

interface DashboardStats {
  totalInterviews: number;
  averageScore: number;
  bestScore: number;
  improvementRate: number;
  avgTimePerQuestion: number;
}

export const DashboardPerformance = () => {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalInterviews: 0,
    averageScore: 0,
    bestScore: 0,
    improvementRate: 0,
    avgTimePerQuestion: 0,
  });
  const [interviews, setInterviews] = useState<Interview[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Fetch user's interviews
        const interviewsQuery = query(
          collection(db, "interviews"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
        const interviewsSnap = await getDocs(interviewsQuery);
        const interviewsData = interviewsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Interview[];

        // Fetch user's answers
        const answersQuery = query(
          collection(db, "userAnswers"),
          where("userId", "==", userId)
        );
        const answersSnap = await getDocs(answersQuery);
        const answersData = answersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserAnswer[];

        setInterviews(interviewsData);

        // Calculate statistics
        calculateStats(interviewsData, answersData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  const calculateStats = (interviews: Interview[], answers: UserAnswer[]) => {
    if (interviews.length === 0) {
      return;
    }

    // Group answers by interview
    const answersByInterview = answers.reduce((acc, answer) => {
      const mockId = answer.mockIdRef;
      if (!acc[mockId]) acc[mockId] = [];
      acc[mockId].push(answer);
      return acc;
    }, {} as Record<string, UserAnswer[]>);

    // Calculate average score per interview using real ratings from Firebase
    const interviewScores = Object.entries(answersByInterview).map(
      ([, answers]) => {
        // Calculate score based on ratings (out of 10) from AI evaluation
        const totalRating = answers.reduce((sum, a) => sum + (a.rating || 0), 0);
        const avgRating = totalRating / answers.length;
        // Convert rating (0-10) to percentage (0-100)
        const score = (avgRating / 10) * 100;
        return score;
      }
    );

    const totalInterviews = interviews.length;
    const averageScore = interviewScores.length > 0 
      ? interviewScores.reduce((sum, score) => sum + score, 0) / interviewScores.length 
      : 0;
    const bestScore = Math.max(...interviewScores, 0);

    // Calculate improvement rate - compare first half vs second half
    if (interviewScores.length > 1) {
      const midPoint = Math.floor(interviewScores.length / 2);
      const firstHalf = interviewScores.slice(0, midPoint);
      const secondHalf = interviewScores.slice(midPoint);
      const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
      const improvementRate = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
      
      setStats({
        totalInterviews,
        averageScore: Math.round(averageScore),
        bestScore: Math.round(bestScore),
        improvementRate: Math.round(improvementRate),
        avgTimePerQuestion: Math.round(answers.reduce((sum, a) => sum + (a.timeTaken || 0), 0) / answers.length || 0),
      });
    } else {
      // If only one interview, no improvement rate
      setStats({
        totalInterviews,
        averageScore: Math.round(averageScore),
        bestScore: Math.round(bestScore),
        improvementRate: 0,
        avgTimePerQuestion: Math.round(answers.reduce((sum, a) => sum + (a.timeTaken || 0), 0) / answers.length || 0),
      });
    }
  };

  if (loading) {
    return <LoaderPage className="w-full h-[70vh]" />;
  }

  return (
    <div className="flex flex-col w-full gap-8 py-5">
      <CustomBreadCrumb
        breadCrumbPage="Performance Dashboard"
        breadCrumpItems={[{ label: "Dashboard", link: "/generate" }]}
      />

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Performance Dashboard</h1>
        <p className="text-muted-foreground">Your Interview Growth Overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInterviews}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">Across all interviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bestScore}%</div>
            <p className="text-xs text-muted-foreground">Personal best</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.improvementRate > 0 ? '+' : ''}{stats.improvementRate}%
            </div>
            <p className="text-xs text-muted-foreground">Over time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgTimePerQuestion}s</div>
            <p className="text-xs text-muted-foreground">Per question</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {stats.totalInterviews === 0 && (
        <Card className="p-12 text-center">
          <CardHeader>
            <CardTitle>No Interviews Yet</CardTitle>
            <CardDescription>
              Take your first mock interview to see your performance analytics here
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Interview List */}
      {stats.totalInterviews > 0 && (
        <>
          <Separator className="my-4" />
          
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold">Your Interviews</h2>
            <p className="text-muted-foreground">
              All your completed mock interviews ({stats.totalInterviews} total)
            </p>
          </div>

          <div className="md:grid md:grid-cols-3 gap-3 py-4">
            {interviews.map((interview) => (
              <InterviewPin key={interview.id} interview={interview} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
