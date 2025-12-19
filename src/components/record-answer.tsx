/* eslint-disable @typescript-eslint/no-unused-vars */
import { useAuth } from "@clerk/clerk-react";
import {
  CircleStop,
  Loader,
  Mic,
  RefreshCw,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";
import useSpeechToText, { ResultType } from "react-hook-speech-to-text";
import { useParams, useNavigate } from "react-router-dom";
import { TooltipButton } from "./tooltip-button";
import { toast } from "sonner";
import { SaveModal } from "./save-modal";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase.config";
import { Question } from "@/types";

interface RecordAnswerProps {
  question: Question;
  onSaveAnswer: (userAnswer: string) => void;
  currentIndex: number;
  totalQuestions: number;
}

export const RecordAnswer = ({
  question,
  onSaveAnswer,
  currentIndex,
  totalQuestions,
}: RecordAnswerProps) => {
  const {
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  const [userAnswer, setUserAnswer] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { userId } = useAuth();
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const recordUserAnswer = async () => {
    if (isRecording) {
      stopSpeechToText();

      if (userAnswer?.length < 30) {
        toast.error("Error", {
          description: "Your answer should be more than 30 characters",
        });

        return;
      }
    } else {
      startSpeechToText();
    }
  };

  const recordNewAnswer = () => {
    setUserAnswer("");
    stopSpeechToText();
    startSpeechToText();
  };

  const saveUserAnswer = async () => {
    setLoading(true);

    if (!userAnswer || userAnswer.length < 30) {
      toast.error("Error", {
        description: "Please provide a valid answer before saving"
      });
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, "userAnswers"), {
        mockIdRef: interviewId,
        questionId: question.id,
        question: question.question,
        userAnswer: userAnswer,
        timeTaken: 0,
        userId,
        createdAt: serverTimestamp(),
      });

      onSaveAnswer(userAnswer);

      toast.success("Saved", { 
        description: `Answer ${currentIndex + 1}/${totalQuestions} saved successfully` 
      });

      if (currentIndex === totalQuestions - 1) {
        toast.success("Interview Complete!", {
          description: "Generating your feedback report..."
        });
        setTimeout(() => {
          navigate(`/generate/feedback/${interviewId}`, { replace: true });
        }, 1500);
      } else {
        setUserAnswer("");
        stopSpeechToText();
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to save answer. Please try again.",
      });
      console.log(error);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  useEffect(() => {
    const combineTranscripts = results
      .filter((result): result is ResultType => typeof result !== "string")
      .map((result) => result.transcript)
      .join(" ");

    setUserAnswer(combineTranscripts);
  }, [results]);

  useEffect(() => {
    setUserAnswer("");
    stopSpeechToText();
  }, [question.id]);

  return (
    <div className="w-full flex flex-col items-center gap-6 mt-4">
      <SaveModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={saveUserAnswer}
        loading={loading}
      />

      <div className="flex justify-center gap-3">
        <TooltipButton
          content={isRecording ? "Stop Recording" : "Start Recording"}
          icon={
            isRecording ? (
              <CircleStop className="min-w-5 min-h-5" />
            ) : (
              <Mic className="min-w-5 min-h-5" />
            )
          }
          onClick={recordUserAnswer}
        />

        <TooltipButton
          content="Record Again"
          icon={<RefreshCw className="min-w-5 min-h-5" />}
          onClick={recordNewAnswer}
        />

        <TooltipButton
          content="Save Answer"
          icon={
            loading ? (
              <Loader className="min-w-5 min-h-5 animate-spin" />
            ) : (
              <Save className="min-w-5 min-h-5" />
            )
          }
          onClick={() => setOpen(true)}
          disbaled={!userAnswer || userAnswer.length < 30}
        />
      </div>

      <div className="w-full mt-4 p-4 border rounded-md bg-gray-50">
        <h2 className="text-lg font-semibold">Your Answer:</h2>

        <p className="text-sm mt-2 text-gray-700 whitespace-normal">
          {userAnswer || "Start recording to see your answer here"}
        </p>

        {interimResult && (
          <p className="text-sm text-gray-500 mt-2">
            <strong>Current Speech:</strong>
            {interimResult}
          </p>
        )}
      </div>
    </div>
  );
};
