import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { TooltipButton } from "./tooltip-button";
import { Volume2, VolumeX, Clock, ChevronRight } from "lucide-react";
import { RecordAnswer } from "./record-answer";
import { Question } from "@/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface QuestionSectionProps {
    questions: Question[];
}

export const QuestionSection = ({ questions }: QuestionSectionProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(questions[0]?.timeLimitSec || 300);
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSpeech, setCurrentSpeech] = useState<SpeechSynthesisUtterance | null>(null);

    const currentQuestion = questions[currentIndex];

    // Timer logic
    useEffect(() => {
        if (timeLeft <= 0) {
            handleNext(); // auto-submit when time expires
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(t => t - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, currentIndex]);

    // Reset timer when question changes
    useEffect(() => {
        if (currentQuestion) {
            setTimeLeft(currentQuestion.timeLimitSec);
            setQuestionStartTime(Date.now());
        }
    }, [currentIndex, currentQuestion]);

    const handlePlayQuestion = (qst: string) => {
        if (isPlaying && currentSpeech) {
          // stop the speech if already playing
          window.speechSynthesis.cancel();
          setIsPlaying(false);
          setCurrentSpeech(null);
        } else {
          if ("speechSynthesis" in window) {
            const speech = new SpeechSynthesisUtterance(qst);
            window.speechSynthesis.speak(speech);
            setIsPlaying(true);
            setCurrentSpeech(speech);
    
            // handle the speech end
            speech.onend = () => {
              setIsPlaying(false);
              setCurrentSpeech(null);
            };
          }
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handleSaveAnswer = (userAnswer: string) => {
        const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
        const newAnswer = {
            questionId: currentQuestion.id,
            userAnswer,
            timeTaken
        };
        setAnswers(prev => [...prev, newAnswer]);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTypeColor = (type: string) => {
        switch(type) {
            case "TECH": return "bg-blue-100 text-blue-800";
            case "DSA": return "bg-purple-100 text-purple-800";
            case "HR": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="w-full min-h-96 border rounded-md p-4">
            {/* Progress Bar */}
            <div className="w-full mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">
                        Question {currentIndex + 1} of {questions.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <Clock className={cn(
                            "w-4 h-4",
                            timeLeft < 30 ? "text-red-500" : "text-gray-500"
                        )} />
                        <span className={cn(
                            "text-sm font-semibold",
                            timeLeft < 30 ? "text-red-500" : "text-gray-700"
                        )}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Current Question */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <Badge className={getTypeColor(currentQuestion?.type)}>
                        {currentQuestion?.type}
                    </Badge>
                    <Badge variant="outline">
                        {currentQuestion?.difficulty}
                    </Badge>
                </div>

                <p className="text-base text-left tracking-wide text-neutral-700 font-medium">
                    {currentQuestion?.question}
                </p>

                <div className="w-full flex items-center justify-between">
                    <TooltipButton
                        content={isPlaying ? "Stop" : "Play Question"}
                        icon={
                            isPlaying ? (
                                <VolumeX className="min-w-5 min-h-5 text-muted-foreground" />
                            ) : (
                                <Volume2 className="min-w-5 min-h-5 text-muted-foreground" />
                            )
                        }
                        onClick={() => handlePlayQuestion(currentQuestion?.question)}
                    />

                    {currentIndex < questions.length - 1 && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleNext}
                        >
                            Next Question <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    )}
                </div>

                <RecordAnswer
                    question={currentQuestion}
                    onSaveAnswer={handleSaveAnswer}
                    currentIndex={currentIndex}
                    totalQuestions={questions.length}
                />
            </div>
        </div>
    )
}