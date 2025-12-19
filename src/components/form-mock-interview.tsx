import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";

import { Interview } from "@/types";

import { CustomBreadCrumb } from "./custom-bread-crumb";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { Headings } from "./headings";
import { Button } from "./ui/button";
import { Loader, Trash2 } from "lucide-react";
import { Separator } from "./ui/separator";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { createChatSession } from "@/scripts";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase.config";

interface FormMockInterviewProps {
  initialData: Interview | null;
}

const formSchema = z.object({
  position: z
    .string()
    .min(1, "Position is required")
    .max(100, "Position must be 100 characters or less"),
  description: z.string().min(10, "Description is required"),
  experience: z.coerce
    .number()
    .min(0, "Experience cannot be empty or negative"),
  techStack: z.string().min(1, "Tech stack must be at least a character"),
});

type FormData = z.infer<typeof formSchema>;

export const FormMockInterview = ({ initialData }: FormMockInterviewProps) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {},
  });

  const { isValid, isSubmitting } = form.formState;
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { userId } = useAuth();

  const title = initialData
    ? initialData.position
    : "Create a new mock interview";

  const breadCrumpPage = initialData ? initialData?.position : "Create";
  const actions = initialData ? "Save Changes" : "Create";
  const toastMessage = initialData
    ? { title: "Updated..!", description: "Changes saved successfully..." }
    : { title: "Created..!", description: "New Mock Interview created..." };


  const cleanAiResponse = (responseText: string) => {
    // Step 1: Trim any surrounding whitespace
    let cleanText = responseText.trim();
    
    // Step 2: Remove any occurrences of "json" or code block symbols (``` or `)
    cleanText = cleanText.replace(/(json|```|`)/g, "");
    
    // Step 3: Extract a JSON array by capturing text between square brackets
    const jsonArrayMatch = cleanText.match(/\[.*\]/s);
    if (jsonArrayMatch) {
        cleanText = jsonArrayMatch[0];
    } else {
        throw new Error("No JSON array found in response");
    }
    
    // Step 4: Fix common escape sequence issues
    cleanText = cleanText
        .replace(/\\'/g, "'")  // Replace \' with just '
        .replace(/\\"/g, '"')  // Replace \" with just "
        .replace(/\\\\/g, '\\') // Fix double backslashes
        .replace(/\\n/g, ' ')   // Replace newlines with spaces
        .replace(/\\t/g, ' ')   // Replace tabs with spaces
        .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
    
    // Step 5: Handle truncated JSON by ensuring proper closing
    // Check if array is properly closed
    const openBraces = (cleanText.match(/\{/g) || []).length;
    const closeBraces = (cleanText.match(/\}/g) || []).length;
    
    if (openBraces > closeBraces) {
        // Truncated - remove incomplete last object
        const lastCompleteIndex = cleanText.lastIndexOf('},');
        if (lastCompleteIndex > 0) {
            cleanText = cleanText.substring(0, lastCompleteIndex + 1) + ']';
        } else {
            throw new Error("Response was truncated and cannot be recovered");
        }
    }
    
    // Step 6: Parse the clean JSON text into an array of objects
    try {
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Failed to parse JSON:", cleanText.substring(0, 500));
        throw new Error("Invalid JSON format: " + (error as Error)?.message);
    }
  };

  const getDifficulty = (exp: number): string => {
    if (exp <= 1) return "easy";
    if (exp <= 3) return "medium";
    return "hard";
  };

  const getTimeLimitByType = (type: string, difficulty: string): number => {
    const baseTime = { easy: 180, medium: 300, hard: 420 }; // in seconds
    if (type === "DSA") return baseTime[difficulty as keyof typeof baseTime] + 120; // DSA gets more time
    if (type === "HR") return 120; // HR questions get 2 minutes
    return baseTime[difficulty as keyof typeof baseTime];
  };

  const generateAiResponse = async (data: FormData) => {
    const TOTAL_QUESTIONS = 15;
    const difficulty = getDifficulty(data.experience);

    const prompt = `Generate ${TOTAL_QUESTIONS} interview questions as JSON array.

Position: ${data.position}
Experience: ${data.experience} years
Tech Stack: ${data.techStack}
Difficulty: ${difficulty}

Distribution: 6 TECH (${data.techStack}), 6 DSA, 3 HR questions

DSA Topics: ${data.experience <= 1 ? 'Arrays, Strings' : data.experience <= 3 ? 'HashMaps, Recursion, Sorting' : 'Trees, Graphs, DP'}

Format (keep expectedAnswer concise, max 3 sentences):
[{
  "id": "Q1",
  "question": "...",
  "type": "TECH|DSA|HR",
  "difficulty": "${difficulty}",
  "expectedAnswer": "Key points only",
  "timeLimitSec": 300
}]

Return ONLY valid JSON array.`;

    const chatSession = createChatSession();
    const aiResult = await chatSession.sendMessage(prompt);
    const cleanedResponse = cleanAiResponse(aiResult.response.text());

    // Add IDs and time limits if not present
    const questionsWithMeta = cleanedResponse.map((q: any, index: number) => ({
      ...q,
      id: q.id || `q_${Date.now()}_${index}`,
      timeLimitSec: q.timeLimitSec || getTimeLimitByType(q.type, q.difficulty)
    }));

    return questionsWithMeta;
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);

      if (initialData) {
        // update
        if (isValid) {
          const aiResult = await generateAiResponse(data);
          const totalTimeSec = aiResult.reduce((sum: number, q: any) => sum + q.timeLimitSec, 0);

          await updateDoc(doc(db, "interviews", initialData?.id), {
            questions: aiResult,
            interviewMeta: {
              totalQuestions: aiResult.length,
              totalTimeSec,
              experienceLevel: data.experience
            },
            ...data,
            updatedAt: serverTimestamp(),
          }).catch((error) => console.log(error));
          toast(toastMessage.title, { description: toastMessage.description });
        }
      } else {
        // create a new mock interview
        if (isValid) {
          const aiResult = await generateAiResponse(data);
          const totalTimeSec = aiResult.reduce((sum: number, q: any) => sum + q.timeLimitSec, 0);

          const docRef = await addDoc(collection(db, "interviews"), {
            ...data,
            userId,
            questions: aiResult,
            interviewMeta: {
              totalQuestions: aiResult.length,
              totalTimeSec,
              experienceLevel: data.experience
            },
            createdAt: serverTimestamp(),
          });

          toast(toastMessage.title, { description: toastMessage.description });
          
          // Navigate to the interview setup page with webcam
          navigate(`/generate/interview/${docRef.id}`, { replace: true });
          return;
        }
      }

      navigate("/generate", { replace: true });
    } catch (error) {
      console.log(error);
      toast.error("Error..", {
        description: `Something went wrong. Please try again later`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      form.reset({
        position: initialData.position,
        description: initialData.description,
        experience: initialData.experience,
        techStack: initialData.techStack,
      });
    }
  }, [initialData, form]);

  return (
    <div className="w-full flex-col space-y-4">
      <CustomBreadCrumb
        breadCrumbPage={breadCrumpPage}
        breadCrumpItems={[{ label: "Mock Interviews", link: "/generate" }]}
      />

      <div className="mt-4 flex items-center justify-between w-full">
        <Headings title={title} isSubHeading />

        {initialData && (
          <Button size={"icon"} variant={"ghost"}>
            <Trash2 className="min-w-4 min-h-4 text-red-500" />
          </Button>
        )}
      </div>

      <Separator className="my-4" />

      <div className="my-6"></div>

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full p-8 rounded-lg flex-col flex items-start justify-start gap-6 shadow-md "
        >
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem className="w-full space-y-4">
                <div className="w-full flex items-center justify-between">
                  <FormLabel>Job Role / Job Position</FormLabel>
                  <FormMessage className="text-sm" />
                </div>
                <FormControl>
                  <Input
                    className="h-12"
                    disabled={loading}
                    placeholder="eg:- Full Stack Developer"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="w-full space-y-4">
                <div className="w-full flex items-center justify-between">
                  <FormLabel>Job Description</FormLabel>
                  <FormMessage className="text-sm" />
                </div>
                <FormControl>
                  <Textarea
                    className="h-12"
                    disabled={loading}
                    placeholder="eg:- describle your job role"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experience"
            render={({ field }) => (
              <FormItem className="w-full space-y-4">
                <div className="w-full flex items-center justify-between">
                  <FormLabel>Years of Experience</FormLabel>
                  <FormMessage className="text-sm" />
                </div>
                <FormControl>
                  <Input
                    type="number"
                    className="h-12"
                    disabled={loading}
                    placeholder="eg:- 5 Years"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="techStack"
            render={({ field }) => (
              <FormItem className="w-full space-y-4">
                <div className="w-full flex items-center justify-between">
                  <FormLabel>Tech Stacks</FormLabel>
                  <FormMessage className="text-sm" />
                </div>
                <FormControl>
                  <Textarea
                    className="h-12"
                    disabled={loading}
                    placeholder="eg:- React, Typescript..."
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="w-full flex items-center justify-end gap-6">
            <Button
              type="reset"
              size={"sm"}
              variant={"outline"}
              disabled={isSubmitting || loading}
            >
              Reset
            </Button>
            <Button
              type="submit"
              size={"sm"}
              disabled={isSubmitting || !isValid || loading}
            >
              {loading ? (
                <Loader className="text-gray-50 animate-spin" />
              ) : (
                actions
              )}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};