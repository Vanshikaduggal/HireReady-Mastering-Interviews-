import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * POST /phonic/feedback/generate
 * Generate AI feedback using Gemini (FREE!)
 */
router.post("/generate", async (req, res) => {
  try {
    const { transcript, interviewId } = req.body;

    if (!transcript || !Array.isArray(transcript)) {
      return res.status(400).json({ 
        error: "Transcript array is required" 
      });
    }

    console.log(`🧠 Generating feedback for interview ${interviewId}`);

    // Format transcript for Gemini
    const transcriptText = transcript
      .map(item => `${item.speaker === 'ai' ? 'Interviewer' : 'Candidate'}: ${item.text}`)
      .join('\n\n');

    // Create prompt for Gemini
    const prompt = `You are an expert interview coach analyzing a phone mock interview. 

Interview Transcript:
${transcriptText}

Analyze this interview and provide detailed feedback in the following JSON format:

{
  "score": <number 0-100>,
  "strengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>"
  ],
  "weaknesses": [
    "<weakness 1>",
    "<weakness 2>",
    "<weakness 3>"
  ],
  "recommendations": [
    "<specific recommendation 1>",
    "<specific recommendation 2>",
    "<specific recommendation 3>"
  ],
  "communicationQuality": "<one of: Excellent, Good, Fair, Needs Improvement>"
}

Evaluation Criteria:
- Communication clarity and confidence
- Response structure and completeness
- Technical knowledge (if applicable)
- Professional tone
- Examples and specificity

Provide honest, constructive feedback that will help them improve. Be specific with examples from the transcript.

Return ONLY the JSON object, no other text.`;

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse feedback JSON from AI response");
    }

    const feedback = JSON.parse(jsonMatch[0]);

    console.log(`✅ Feedback generated - Score: ${feedback.score}/100`);

    res.json({
      success: true,
      feedback,
      interviewId,
    });

  } catch (error) {
    console.error("❌ Error generating feedback:", error);
    res.status(500).json({ 
      error: "Failed to generate feedback",
      details: error.message 
    });
  }
});

/**
 * POST /phonic/feedback/save
 * Save feedback to database
 */
router.post("/save", async (req, res) => {
  try {
    const { userId, eventId, transcript, feedback, completedAt } = req.body;

    console.log(`💾 Saving feedback for user ${userId}, event ${eventId}`);

    // Here you would save to Firebase
    // For now, we'll just return success
    
    const interviewResult = {
      interviewId: eventId,
      userId,
      transcript,
      feedback,
      completedAt,
      status: "completed",
    };

    console.log(`✅ Feedback saved successfully`);

    res.json({
      success: true,
      message: "Feedback saved successfully",
      data: interviewResult,
    });

  } catch (error) {
    console.error("❌ Error saving feedback:", error);
    res.status(500).json({ 
      error: "Failed to save feedback",
      details: error.message 
    });
  }
});

/**
 * GET /phonic/feedback/:interviewId
 * Get feedback for an interview
 */
router.get("/:interviewId", async (req, res) => {
  try {
    const { interviewId } = req.params;

    console.log(`📊 Fetching feedback for interview ${interviewId}`);

    // Here you would fetch from Firebase
    // For now, return mock data for testing
    
    res.json({
      success: true,
      data: {
        interviewId,
        feedback: {
          score: 85,
          strengths: [
            "Clear and articulate communication",
            "Confident delivery",
            "Good use of examples"
          ],
          weaknesses: [
            "Some answers could be more structured",
            "Occasionally too brief"
          ],
          recommendations: [
            "Use the STAR method for behavioral questions",
            "Prepare 2-3 detailed project examples",
            "Practice explaining technical concepts simply"
          ],
          communicationQuality: "Good"
        }
      }
    });

  } catch (error) {
    console.error("❌ Error fetching feedback:", error);
    res.status(500).json({ 
      error: "Failed to fetch feedback",
      details: error.message 
    });
  }
});

export default router;
