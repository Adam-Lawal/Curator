import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";

const upload = multer({ dest: "uploads/" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy initialize Gemini API to prevent server crashes on startup if keys are missing
  const getAiClient = () => {
    // Check various possible environment variable names for the API key
    const apiKey = process.env.Adamic || process.env.adamic || process.env.ADAMIC || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API key is missing. Please ensure your secret key 'Adamic' is configured correctly.");
    }
    return new GoogleGenAI({ apiKey: apiKey });
  };

  const getMimeType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt': return 'text/plain';
      case 'ppt':
      case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      default: return 'text/plain';
    }
  };

  // Helper function for API retries with exponential backoff
  const executeWithRetry = async <T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 2000): Promise<T> => {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await operation();
      } catch (error: any) {
        attempt++;
        const isRetryable = error?.status === 503 || error?.status === 429 || 
                            error?.message?.includes('503') || error?.message?.includes('429');
        
        if (attempt >= maxRetries || !isRetryable) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`API overloaded (503/429). Retrying in ${delay}ms... (Attempt ${attempt} of ${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error("Max retries reached");
  };

  // API Routes
  app.post("/api/analyze", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fileBytes = fs.readFileSync(file.path);
      const base64Data = fileBytes.toString("base64");
      const mimeType = getMimeType(file.originalname);

      const ai = getAiClient();
      
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error("Analysis timed out after 30 seconds")), 30000)
      );

      const response = await Promise.race([
        executeWithRetry(() => ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            "Analyze this document. Extract the first 500 words as 'originalText'. Count the total words for 'wordCount'. Estimate read time (e.g., '5m') for 'readTime'. Determine the overall 'sentiment'. Provide 3-5 'summaryBullets'. Write a short 'narrativeOverview'."
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                sentiment: { type: Type.STRING, description: "Overall sentiment, e.g., Positive, Neutral, Negative" },
                wordCount: { type: Type.NUMBER, description: "Estimated word count" },
                readTime: { type: Type.STRING, description: "Estimated read time, e.g., 5m" },
                summaryBullets: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 key takeaways" },
                narrativeOverview: { type: Type.STRING, description: "A short paragraph summarizing the document" },
                originalText: { type: Type.STRING, description: "First 500 words of the document text" }
              },
              required: ["sentiment", "wordCount", "readTime", "summaryBullets", "narrativeOverview", "originalText"]
            }
          }
        })),
        timeoutPromise
      ]);

      // Cleanup uploaded file
      fs.unlinkSync(file.path);

      if (!response.text) {
        throw new Error("No response text from Gemini");
      }

      const result = JSON.parse(response.text);
      res.json(result);
    } catch (error: any) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: error?.message || "Failed to analyze document" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { user_query, context } = req.body;
      
      if (!user_query) {
        return res.status(400).json({ error: "No query provided" });
      }

      const ai = getAiClient();
      
      const timeoutPromise = new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error("Chat response timed out after 30 seconds")), 30000)
      );

      const response = await Promise.race([
        executeWithRetry(() => ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Document Context:\n${context || "No context provided."}\n\nUser Query: ${user_query}\n\nPlease answer the user's query based on the document context provided above.`,
        })),
        timeoutPromise
      ]);

      res.json({
        response: response.text
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error?.message || "Failed to generate chat response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
