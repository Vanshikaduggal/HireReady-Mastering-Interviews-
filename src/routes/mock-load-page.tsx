import { db } from "@/config/firebase.config";
import { Interview } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LoaderPage } from "./loader-page";
import { CustomBreadCrumb } from "@/components/custom-bread-crumb";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles, WebcamIcon, ShieldCheck } from "lucide-react";
import { InterviewPin } from "@/components/pin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Webcam from "react-webcam";
import { toast } from "sonner";
import { useFaceDetection } from "@/hooks/useFaceDetection";

export const MockLoadPage = () => {

    const { interviewId } = useParams<{ interviewId: string }>();
    const [interview, setInterview] = useState<Interview | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isWebCamEnabled, setIsWebCamEnabled] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [baselineVerified, setBaselineVerified] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const webcamRef = useRef<Webcam>(null);
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

    // Get video element from webcam ref
    useEffect(() => {
        if (webcamRef.current?.video && isWebCamEnabled) {
            videoRef.current = webcamRef.current.video;
        }
    }, [isWebCamEnabled]);

    const { captureBaseline, isModelsLoaded } = useFaceDetection({
        videoElement: videoRef.current,
        isEnabled: false, // Not monitoring during setup, only baseline
        onViolation: () => {}, // Not used during baseline
    });

    const handleVerifyBaseline = async () => {
        if (!isCameraReady || !videoRef.current) {
            toast.error("Camera still loading", {
                description: "Please wait a moment for the camera to initialize.",
            });
            return;
        }

        setIsVerifying(true);
        
        try {
            // captureBaseline now handles waiting for camera to be ready
            const faceCount = await captureBaseline();
            
            console.log("Face count detected:", faceCount);
            
            if (faceCount === 0) {
                toast.error("No face detected", {
                    description: "Please ensure your face is clearly visible, well-lit, and centered in the camera.",
                });
            } else if (faceCount > 1) {
                toast.error("Multiple faces detected", {
                    description: "Please ensure only one person is visible during the interview.",
                });
            } else {
                toast.success("Verification successful!", {
                    description: "Face detected successfully. You can now start the interview.",
                });
                setBaselineVerified(true);
            }
        } catch (error) {
            console.error("Baseline capture error:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error("Verification failed", {
                description: errorMessage.includes("too long") 
                    ? "Camera is taking too long to initialize. Please refresh and try again."
                    : "Please ensure good lighting and your camera is working properly.",
            });
        } finally {
            setIsVerifying(false);
        }
    };

    if (isLoading) {
        return <LoaderPage className="w-full h-[70vh]" />;
    }

  return (
    <div className="flex flex-col w-full gap-8 py-5">
      <div className="flex items-center justify-between w-full gap-2">
        <CustomBreadCrumb
          breadCrumbPage={interview?.position || ""}
          breadCrumpItems={[{ label: "Mock Interviews", link: "/generate" }]}
        />

        <Button 
          size={"sm"} 
          onClick={() => {
            navigate(`/generate/interview/${interviewId}/start`);
          }}
        >
          Start <Sparkles />
        </Button>
      </div>

      {interview && <InterviewPin interview={interview} onMockPage />}

      <Alert className="bg-yellow-100/50 border-yellow-200 p-4 rounded-lg flex items-start gap-3">
        <Lightbulb className="h-5 w-5 text-yellow-600" />
        <div>
          <AlertTitle className="text-yellow-800 font-semibold">
            How to Prepare
          </AlertTitle>
          <AlertDescription className="text-sm text-yellow-700 mt-1">
            1. Enable your webcam to ensure proper monitoring
            <br />
            2. Make sure you are in a quiet, well-lit environment
            <br />
            3. Click "Start" when you're ready to begin
            <br />
            <br />
            <span className="font-medium">Note:</span> You'll receive a personalized report at the end based on your responses.
          </AlertDescription>
        </div>
      </Alert>

      <div className="flex items-center justify-center w-full h-full">
        <div className="w-full h-[400px] md:w-96 flex flex-col items-center justify-center border p-4 bg-gray-50 rounded-md relative">
          {isWebCamEnabled ? (
            <Webcam
              ref={webcamRef}
              onUserMedia={() => {
                setIsWebCamEnabled(true);

                // Wait for actual video frames
                const video = webcamRef.current?.video;
                if (video) {
                  video.onloadeddata = () => {
                    setIsCameraReady(true);
                  };
                }
              }}
              onUserMediaError={() => {
                setIsWebCamEnabled(false);
                setIsCameraReady(false);
              }}
              className="w-full h-full object-cover rounded-md"
              mirrored
            />
          ) : (
            <WebcamIcon className="min-w-24 min-h-24 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button onClick={() => {
          setIsWebCamEnabled(!isWebCamEnabled);
          if (isWebCamEnabled) {
            setIsCameraReady(false);
          }
        }}>
          {isWebCamEnabled ? "Disable Webcam" : "Enable Webcam"}
        </Button>
      </div>
    </div>
  )
}
