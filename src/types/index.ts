import { FieldValue, Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  createdAt: Timestamp | FieldValue;
  updateAt: Timestamp | FieldValue;
}

export type QuestionType = "TECH" | "DSA" | "HR";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  difficulty: Difficulty;
  expectedAnswer: string;
  timeLimitSec: number;
}

export interface InterviewMeta {
  totalQuestions: number;
  totalTimeSec: number;
  experienceLevel: number;
}

export interface Interview {
  id: string;
  position: string;
  description: string;
  experience: number;
  userId: string;
  techStack: string;
  questions: Question[];
  interviewMeta: InterviewMeta;
  createdAt: Timestamp;
  updateAt: Timestamp;
}

export interface UserAnswer {
  id: string;
  mockIdRef: string;
  questionId: string;
  question: string;
  userAnswer: string;
  timeTaken: number;
  userId: string;
  createdAt: Timestamp;
}

export interface EvaluationResult {
  questionId: string;
  score: number;
  strengths: string;
  weaknesses: string;
  feedback: string;
}

export interface InterviewResult {
  id: string;
  mockIdRef: string;
  userId: string;
  answers: UserAnswer[];
  evaluations: EvaluationResult[];
  totalScore: number;
  strengths: string;
  weaknesses: string;
  overallFeedback: string;
  createdAt: Timestamp;
}