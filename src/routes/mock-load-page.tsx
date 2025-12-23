import { db } from "@/config/firebase.config";
import { Interview } from "@/types";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LoaderPage } from "./loader-page";
import { CustomBreadCrumb } from "@/components/custom-bread-crumb";
import { Button } from "@/components/ui/button";
import { Lightbulb, Sparkles, WebcamIcon } from "lucide-react";
import { InterviewPin } from "@/components/pin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Webcam from "react-webcam";

export const MockLoadPage = () => {

    const { interviewId } = useParams<{ interviewId: string }>();
    const [interview, setInterview] = useState<Interview | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isWebCamEnabled, setIsWebCamEnabled] = useState(false);
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
                  };
                }
              }}
              onUserMediaError={() => {
                setIsWebCamEnabled(false);
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
        }}>
          {isWebCamEnabled ? "Disable Webcam" : "Enable Webcam"}
        </Button>
      </div>
    </div>
  )
}
