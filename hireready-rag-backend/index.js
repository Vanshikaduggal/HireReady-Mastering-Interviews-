import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoute from "./routes/chat.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/chat", chatRoute);

app.get("/", (req, res) => {
  res.json({ message: "🚀 RAG Mentor API is running!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 RAG server running on http://localhost:${PORT}`);
});
