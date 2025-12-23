# HireReady - AI Mock Interview Platform

A modern web application that provides AI-powered mock interviews to help users prepare for real job interviews. The platform uses Google's Generative AI to simulate realistic interview scenarios and provide detailed feedback.

## Features

- 🔐 **Authentication**: Secure user authentication using Clerk
- 🤖 **AI-Powered Interviews**: Realistic interview simulations using Google's Generative AI
- 💬 **RAG-Powered Mentor Chatbot**: AI mentor using Retrieval-Augmented Generation for personalized career guidance
- 🎥 **Video Recording**: Record and review your interview responses
- 📊 **Detailed Feedback**: Get comprehensive feedback on your performance
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🌙 **Dark Mode**: Supports both light and dark themes
- 📝 **Customizable Interviews**: Create and edit interview scenarios

## Tech Stack

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI Components
- **Authentication**: Clerk
- **AI Integration**: Google Generative AI
- **Database**: Firebase
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: React Router DOM
- **UI Components**: Radix UI, Lucide Icons
- **Development Tools**: ESLint, TypeScript, PostCSS

### Backend (RAG Mentor Chatbot)
- **Framework**: Node.js, Express
- **AI/LLM**: Google Generative AI (Gemini)
- **Vector Database**: ChromaDB
- **RAG Framework**: LangChain
- **Embeddings**: Google Generative AI Embeddings

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker (for ChromaDB)
- Firebase account
- Google Cloud account (for Generative AI)
- Clerk account

### Installation
#### 1. Clone the repository:
```bash
git clone [repository-url]
cd ai_mock_interview
```

#### 2. Frontend Setup

Install frontend dependencies:
```bash
npm install
```

Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_GOOGLE_AI_API_KEY=your_google_ai_api_key
```

Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

#### 3. Backend Setup (RAG Mentor Chatbot)

Navigate to the backend directory:
```bash
cd hireready-rag-backend
├── src/                          # Frontend source code
│   ├── assets/                   # Static assets
│   ├── components/               # Reusable UI components
│   ├── config/                   # Configuration files
│   ├── handlers/                 # API and event handlers
│   ├── layouts/                  # Page layouts
│   ├── lib/                      # Utility functions
│   ├── provider/                 # Context providers
│   ├── routes/                   # Page components
│   ├── scripts/                  # Helper scripts
│   ├── types/                    # TypeScript type definitions
│   ├── App.tsx                   # Main application component
│   └── main.tsx                  # Application entry point
│
├── hireready-rag-backend/        # RAG Mentor Chatbot Backend
│   ├── routes/                   # API routes
│   │   └── chat.js               # Chat endpoint with RAG
│   ├── scripts/                  # Backend scripts
│   │   ├── ingest.js             # Knowledge base ingestion
│   │   └── chat.js               # Test chat script
│   ├── rag-data/                 # Knowledge base markdown files
│   │   ├── interview-guidance.md
│   │   ├── role-roadmap.md
│   │   └── tech-stack.md
│   ├── chroma_db/                # Vector database storage
│   ├── index.js                  # Express server
│   └── package.json              # Backend dependencies
│
├── public/                       # Public assets
└── package.json                  # Frontend dependencies

**Note:** You need TWO API keys:
- `GOOGLE_API_KEY` - For generating embeddings (text-embedding-001)
- `GEMINI_API_KEY` - For chatbot responses (gemini-flash-latest)

#### 4. Start ChromaDB (Vector Database)

Run ChromaDB using Docker:
```bash
docker run -p 8000:8000 chromadb/chroma
```

Leave this terminal running. ChromaDB will be available at `http://localhost:8000`

#### 5. Ingest Knowledge Base (One-time Setup)

In a new terminal, navigate to the backend directory and run:
```bash
cd hireready-rag-backend
npm run ingest
```

This will:
- Load markdown files from `rag-data/` directory
- Split them into chunks
- Generate embeddings using Google AI
- Store them in ChromaDB

**⚠️ Important:** The ingestion process uses Google's free tier API with rate limits. The script automatically:
- Processes documents in small batches (3 chunks at a time)
- Adds 3-second delays between batches to avoid quota errors
- If you hit quota limits, wait 24 hours and run again

#### 6. Start the Backend Server

After successful ingestion:
```bash
npm start
```

Or use the combo command to ingest and start in one go:
```bash
npm run setup
```

The backend will run on `http://localhost:5000`

#### 7. Verify Everything is Running

You should have:
- ✅ Frontend: `http://localhost:5173`
- ✅ Backend API: `http://localhost:5000`
- ✅ ChromaDB: `http://localhost:8000`

Test the chatbot endpoint:
```bash
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What tech stack should I learn for frontend development?"}'
npm run build
```

## Project Structure

```
src/
├── assets/         # Static assets
├── components/     # Reusable UI components
├── config/         # Configuration files
├── handlers/       # API and event handlers
├── layouts/        # Page layouts
├── lib/           # Utility functions
├── provider/      # Context providers
├── routes/        # Page components
├── scripts/       # Helper scripts
├── types/         # TypeScript type definitions
├── App.tsx        # Main application component
└── main.tsx       # Application entry point
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend (in hireready-rag-backend/)
- `npm start` - Start the backend server
- `npm run dev` - Start with auto-reload on file changes
- `npm run ingest` - Ingest knowledge base into ChromaDB
- `npm run setup` - Ingest knowledge base AND start server (one command)
- `npm run check` - Test chatbot with sample query

## Troubleshooting

### ChromaDB Issues
- **Error:** "ChromaDB is not running"
- **Solution:** Make sure Docker is running and start ChromaDB:
  ```bash
  docker run -p 8000:8000 chromadb/chroma
  ```

### Google API Quota Exceeded
- **Error:** "429 Too Many Requests" or "quota exceeded"
- **Solution:** 
  - Wait 24 hours for quota to reset
  - Use a different Google Cloud project/API key
  - The chatbot will still work with the hardcoded knowledge base in `routes/chat.js`

### Backend Connection Issues
- Ensure the backend is running on port 5000
- Check if your frontend is configured to call `http://localhost:5000/chat`
- Verify environment variables are set correctly

### Port Already in Use
- **Frontend (5173):** Change port in `vite.config.ts`
- **Backend (5000):** Change PORT in `.env` file
- **ChromaDB (8000):** Use `-p 8001:8000` to run on different port

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Generative AI for providing the interview simulation capabilities
- Clerk for authentication services
- Firebase for backend services
- All the open-source libraries and tools used in this project
