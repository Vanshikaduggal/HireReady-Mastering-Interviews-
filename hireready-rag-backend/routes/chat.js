import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Knowledge base as simple text (no vector DB needed)
const knowledgeBase = `
## Frontend Developer
Recommended stack: HTML, CSS, JavaScript, React, Vue, or Angular
Best for: UI-focused roles, startups, design-heavy companies
Skills needed: Responsive design, state management, CSS frameworks
Career path: Junior  Mid  Senior  Lead Frontend  Engineering Manager

## Backend Developer
Recommended stack: Node.js, Python (Django/Flask), Java Spring, or Go
Best for: APIs, databases, scalable systems, enterprise companies
Skills needed: REST APIs, databases, authentication, server optimization
Career path: Junior  Mid  Senior  Backend Architect  CTO

## Full Stack Developer
Recommended stack: MERN (MongoDB, Express, React, Node) or MEAN stack
Best for: Startups, small teams, versatile roles
Skills needed: Both frontend and backend skills
Career path: Full Stack  Senior Full Stack  Tech Lead

## Confused?
If you enjoy design and user experience  Frontend
If you enjoy logic and system architecture  Backend
If you want flexibility  Full Stack

## Interview Guidance
- Practice coding on platforms like LeetCode, HackerRank
- Master data structures: Arrays, Linked Lists, Trees, Graphs
- Learn algorithms: Sorting, Searching, Dynamic Programming
- Prepare behavioral questions: Tell me about yourself, strengths/weaknesses
- Mock interviews are crucial for confidence

## Career Roadmap
1. Learn fundamentals (HTML, CSS, JS)
2. Pick a framework (React, Vue, Angular)
3. Build projects (portfolio is key)
4. Learn backend basics (if full stack)
5. Master Git and deployment
6. Apply for jobs and keep learning
`;

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log(` User question: ${message}`);

    // Initialize Gemini with correct model name
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `You are an experienced career mentor for a mock interview platform called HireReady.

Your role:
- Guide students through career decisions with empathy and clarity
- Ask clarifying questions when needed (experience level, interests, goals)
- Provide actionable, step-by-step advice
- Be encouraging and supportive
- Share practical examples and real-world insights

Important guidelines:
- If the question is vague, ask clarifying questions before giving advice
- Don'\''t assume the user'\''s skill level or background
- Suggest multiple paths when appropriate
- Focus on practical, achievable steps
- Reference specific technologies and resources when relevant

Knowledge base:
${knowledgeBase}

User'\''s question:
${message}

Provide a helpful, mentor-like response:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log(" Response generated");

    res.json({ reply: text });

  } catch (error) {
    console.error(" Error:", error);
    res.status(500).json({ 
      error: "Failed to process request",
      details: error.message 
    });
  }
});

export default router;
