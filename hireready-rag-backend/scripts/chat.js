import express from "express";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log( User question: );

    // Connect to existing vector store
    const vectorStore = await Chroma.fromExistingCollection(
      new OpenAIEmbeddings(),
      { collectionName: "hireready-mentor" }
    );

    // Retrieve relevant documents
    const retriever = vectorStore.asRetriever(3);
    const docs = await retriever.getRelevantDocuments(message);

    console.log( Retrieved  relevant documents);

    // Combine context from retrieved documents
    const context = docs.map(d => d.pageContent).join("\n\n");

    // Initialize LLM
    const llm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.3,
    });

    // Enhanced mentor prompt with agent-like behavior
    const prompt = You are an experienced career mentor for a mock interview platform called HireReady.

Your role:
- Guide students through career decisions with empathy and clarity
- Ask clarifying questions when needed (experience level, interests, goals)
- Provide actionable, step-by-step advice
- Be encouraging and supportive
- Share practical examples and real-world insights

Important guidelines:
- If the question is vague, ask clarifying questions before giving advice
- Don't assume the user's skill level or background
- Suggest multiple paths when appropriate
- Focus on practical, achievable steps
- Reference specific technologies and resources when relevant

Context from knowledge base:


User's question:


Provide a helpful, mentor-like response:;

    const response = await llm.invoke(prompt);

    console.log(" Response generated");

    res.json({ reply: response.content });

  } catch (error) {
    console.error(" Error:", error);
    res.status(500).json({ 
      error: "Failed to process request",
      details: error.message 
    });
  }
});

export default router;
