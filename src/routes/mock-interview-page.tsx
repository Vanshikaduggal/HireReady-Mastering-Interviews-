import { Interview } from "@/types";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoaderPage } from "./loader-page";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { CustomBreadCrumb } from "@/components/custom-bread-crumb";

import { Video, VideoOff, AlertTriangle } from "lucide-react";
import { QuestionSection } from "@/components/question-section";
import WebCam from "react-webcam";
import { Button } from "@/components/ui/button";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { toast } from "sonner";

export const MockInterviewPage = () => {
    const { interviewId } = useParams<{ interviewId: string }>();
    const [interview, setInterview] = useState<Interview | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isWebCamEnabled, setIsWebCamEnabled] = useState(true);
    const [warnings, setWarnings] = useState(0);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const webcamRef = useRef<WebCam>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!interviewId) {
            navigate("/generate", { replace: true });
            return;
        }

        setIsLoading(true);
        const fetchInterview = async () => {
            try {
              const interviewDoc = await getDoc(doc(db, "interviews", interviewId));
              if (interviewDoc.exists()) {
                setInterview({
                  id: interviewDoc.id,
                  ...interviewDoc.data(),
                } as Interview);
              } else {
                // Interview not found, redirect
                navigate("/generate", { replace: true });
              }
            } catch (error) {
              console.log(error);
              navigate("/generate", { replace: true });
            } finally {
              setIsLoading(false);
            }
        };
    
        fetchInterview();
    }, [interviewId, navigate]);

    // Get video element from webcam
    useEffect(() => {        if (webcamRef.current?.video) {
            videoRef.current = webcamRef.current.video;
            setIsMonitoring(true);
        }
    }, [isWebCamEnabled]);

    const handleViolation = () => {
        setWarnings((prev) => {
            const next = prev + 1;
            
            if (next >= 3) {
                toast.error("Interview Auto-Submitted", {
                    description: "Multiple people detected 3 times. Redirecting to feedback...",
                });
                setTimeout(() => {
                    navigate(`/generate/feedback/${interviewId}`, { replace: true });
                }, 2000);
            } else {
                toast.warning(`Warning ${next}/3: Multiple People Detected`, {
                    description: "Please ensure only you are visible in the camera.",
                    icon: <AlertTriangle className="w-5 h-5" />,
                });
            }
            
            return next;
        });
    };

    const { faceCount, isModelsLoaded } = useFaceDetection({
        videoElement: videoRef.current,
        isEnabled: isMonitoring && isWebCamEnabled,
        onViolation: handleViolation,
    });

    if (isLoading) {
        return <LoaderPage className="w-full h-[70vh]" />;
    }
    
    return (
        <div className="flex flex-col w-full gap-8 py-5">
            <CustomBreadCrumb
                breadCrumbPage="Start"
                breadCrumpItems={[
                { label: "Mock Interviews", link: "/generate" },
                {
                    label: interview?.position || "",
                    link: `/generate/interview/${interview?.id}`,
                },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Webcam Section */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4 space-y-4">
                        <div className="w-full h-[300px] flex flex-col items-center justify-center border-2 border-gray-200 rounded-lg p-4 bg-gray-50 relative">
                            {isWebCamEnabled ? (
                                <>
                                    <WebCam
                                        ref={webcamRef}
                                        onUserMedia={() => setIsWebCamEnabled(true)}
                                        onUserMediaError={() => setIsWebCamEnabled(false)}
                                        mirrored={true}
                                        className="w-full h-full object-cover rounded-md"
                                    />
                                    {warnings > 0 && (
                                        <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 animate-pulse">
                                            <AlertTriangle className="w-3 h-3" />
                                            Warnings: {warnings}/3
                                        </div>
                                    )}
                                    {faceCount > 0 && (
                                        <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                                            {faceCount === 1 ? "✓ 1 person" : `⚠ ${faceCount} people`}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <VideoOff className="w-16 h-16 text-gray-400" />
                                    <p className="text-sm text-gray-500 text-center">
                                        Camera is disabled
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Questions Section */}
                <div className="lg:col-span-2">
                    <div className="flex justify-end mb-4">
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (confirm("Are you sure you want to end this interview? You'll be taken to the feedback page with your current answers.")) {
                                    navigate(`/generate/feedback/${interviewId}`, { replace: true });
                                }
                            }}
                        >
                            End Interview
                        </Button>
                    </div>

                    {interview?.questions && interview?.questions.length > 0 && (
                        <QuestionSection questions={interview?.questions} />
                    )}
                </div>
            </div>
        </div>
    )
}