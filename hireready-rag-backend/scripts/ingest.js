import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

dotenv.config();

const DATA_PATH = "./rag-data";

async function ingest() {
  console.log(" Starting knowledge ingestion...");
  
  const files = fs.readdirSync(DATA_PATH);
  let documents = [];

  for (const file of files) {
    if (file.endsWith('.md')) {
      const content = fs.readFileSync(path.join(DATA_PATH, file), "utf8");
      documents.push({
        pageContent: content,
        metadata: { source: file },
      });
      console.log(` Loaded: ${file}`);
    }
  }

  console.log(` Total documents: ${documents.length}`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const splitDocs = await splitter.splitDocuments(documents);
  console.log(` Split into ${splitDocs.length} chunks`);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY,
    modelName: "models/embedding-001",
  });

  // Test embeddings
  console.log(" Testing embeddings generation...");
  const testEmbed = await embeddings.embedQuery("test");
  console.log(` Embedding dimension: ${testEmbed.length}`);

  await Chroma.fromDocuments(
    splitDocs,
    embeddings,
    { 
      collectionName: "hireready-mentor",
      url: "http://localhost:8000"
    }
  );

  console.log(" Knowledge indexed into vector DB");
  console.log(" Ingestion complete!");
}

ingest().catch(console.error);
