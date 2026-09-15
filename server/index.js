import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadDocument } from './supabaseClient.js';
import { extractWithGemini } from './aiExtractor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const app = express();
const PORT = process.env.PORT || 8000;

// Enable CORS for frontend (Vite runs on http://localhost:5173 by default)
app.use(
  cors({
    origin: true, // Reflect request origin (supports localhost:5173 and any staging/preview URL)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing with generous limit for large document processing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MedTrace AI Processing API',
    model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    supabaseConfigured: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.json({
    name: 'MedTrace AI Document Processing Server',
    status: 'online',
    endpoints: {
      health: 'GET /health',
      processDocument: 'POST /process-document',
    },
  });
});

/**
 * POST /process-document
 * Expects JSON body: { recordId: string, filePath: string }
 * Returns AIProcessingResponse JSON payload
 */
app.post('/process-document', async (req, res) => {
  const { recordId, filePath } = req.body;

  console.log(`[Process Document] Request received for recordId: "${recordId}", filePath: "${filePath}"`);

  if (!filePath || !recordId) {
    return res.status(400).json({
      error: 'Missing required parameters. Both "recordId" and "filePath" are required.',
    });
  }

  try {
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    console.log(`[Process Document] Using Supabase Key starting with: ${supabaseKey?.substring(0, 10)}... (Service role should start with 'eyJhbGciOi')`);
    console.log(`[Process Document] Fetching file from Supabase Storage: ${filePath}`);

    // 1. Download the document securely from Supabase Storage
    const { buffer, mimeType, fileSize } = await downloadDocument(filePath);
    console.log(`[Process Document] Downloaded ${fileSize} bytes (MIME: ${mimeType})`);

    // 2. Run multimodal AI extraction with Google Gemini
    const extractedData = await extractWithGemini(buffer, mimeType);

    // 3. Return 200 OK with strict AIProcessingResponse structure
    console.log(`[Process Document] Successfully processed document for recordId: "${recordId}"`);
    return res.status(200).json(extractedData);
  } catch (error) {
    console.error(`[Process Document Error] Failed processing recordId "${recordId}":`, error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error during document processing';

    // File not found in storage bucket
    if (errorMessage.includes('Failed to download file from Supabase storage') || errorMessage.includes('Object not found')) {
      return res.status(404).json({
        error: 'Medical document not found in storage bucket',
        details: errorMessage,
        recordId,
        filePath,
      });
    }

    // Invalid file uploaded (not medical)
    if (errorMessage.includes('NOT_MEDICAL_DOCUMENT')) {
      return res.status(400).json({
        error: 'The uploaded file does not appear to be a valid medical document. Please upload a lab report, prescription, or clinical note.',
        details: errorMessage,
      });
    }

    // Gemini API key missing
    if (errorMessage.includes('GEMINI_API_KEY is not set')) {
      return res.status(500).json({
        error: 'Google Gemini API key is missing. Please set GEMINI_API_KEY in your .env file.',
        details: errorMessage,
      });
    }

    // Generic error
    return res.status(500).json({
      error: 'Document extraction failed',
      details: errorMessage,
      recordId,
      filePath,
    });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 MedTrace AI Processing Server is running on:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/health`);
  console.log(`   Document Endpoint: POST http://localhost:${PORT}/process-document`);
  console.log(`   Model: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}`);
  console.log('====================================================');
});

export default app;
