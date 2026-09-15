import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const VALID_DOCUMENT_TYPES = [
  'LAB_REPORT',
  'PRESCRIPTION',
  'IMAGING_REPORT',
  'DISCHARGE_SUMMARY',
  'CONSULTATION',
  'MEDICAL_CERTIFICATE',
  'OTHER',
];

/**
 * Normalizes and sanitizes extracted values to enforce strict null-safety and formatting
 */
function sanitizeStringOrNull(val) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  const lower = str.toLowerCase();
  if (
    lower === '' ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'none' ||
    lower === 'unknown' ||
    lower === 'not specified' ||
    lower === 'not found' ||
    lower === 'null' ||
    lower === 'undefined'
  ) {
    return null;
  }
  return str;
}

/**
 * Validates and converts dates to strict YYYY-MM-DD without UTC timezone shifting
 */
function normalizeDate(val) {
  const cleaned = sanitizeStringOrNull(val);
  if (!cleaned) return null;

  // Direct YYYY-MM-DD or YYYY/MM/DD check
  const ymdMatch = cleaned.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // DD-MM-YYYY or MM-DD-YYYY check
  const dmyMatch = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const [, part1, part2, y] = dmyMatch;
    let m = part2;
    let d = part1;
    if (parseInt(part1, 10) <= 12 && parseInt(part2, 10) > 12) {
      m = part1;
      d = part2;
    }
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback to Date object using local date methods to avoid UTC shift
  const parsedTimestamp = Date.parse(cleaned);
  if (!isNaN(parsedTimestamp)) {
    const d = new Date(parsedTimestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Validates and ensures the AI output strictly adheres to AIProcessingResponse
 */
export function sanitizeAIResponse(raw) {
  // 1. Document Type
  let documentType = 'OTHER';
  if (raw.documentType && typeof raw.documentType === 'string') {
    const candidate = raw.documentType.toUpperCase().trim();
    if (VALID_DOCUMENT_TYPES.includes(candidate)) {
      documentType = candidate;
    }
  }

  // 2. Metadata fields with strict null-safety
  const hospital = sanitizeStringOrNull(raw.hospital);
  const doctor = sanitizeStringOrNull(raw.doctor);
  const department = sanitizeStringOrNull(raw.department);
  const patientName = sanitizeStringOrNull(raw.patientName);
  const date = normalizeDate(raw.date);

  // 3. Summary (Patient-friendly explanation)
  let summary = '';
  if (raw.summary && typeof raw.summary === 'string' && raw.summary.trim() !== '') {
    summary = raw.summary.trim();
  } else {
    summary = 'Medical document received and recorded. Please consult with your healthcare provider for clinical interpretation.';
  }

  // 4. Lab Results
  const labResults = Array.isArray(raw.labResults)
    ? raw.labResults.map((item) => ({
        testName: String(item.testName || item.test || 'Test').trim(),
        value: String(item.value ?? '').trim(),
        unit: String(item.unit ?? '').trim(),
        referenceRange: String(item.referenceRange || item.reference_range || '').trim(),
        status: String(item.status || 'normal').toLowerCase().trim(),
      }))
    : [];

  // 5. Medications
  const medications = Array.isArray(raw.medications)
    ? raw.medications.map((item) => ({
        name: String(item.name || item.drug || 'Medication').trim(),
        dosage: String(item.dosage ?? '').trim(),
        frequency: String(item.frequency ?? '').trim(),
        duration: String(item.duration ?? '').trim(),
        instructions: String(item.instructions ?? '').trim(),
      }))
    : [];

  // 6. Findings
  const findings = Array.isArray(raw.findings) ? raw.findings : [];

  return {
    documentType,
    hospital,
    doctor,
    department,
    date,
    patientName,
    summary,
    labResults,
    medications,
    findings,
  };
}

/**
 * Multimodal document extraction using Google Gemini
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - Document MIME type (e.g. application/pdf, image/jpeg)
 * @returns {Promise<import('../src/services/ai').AIProcessingResponse>}
 */
export async function extractWithGemini(buffer, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set in your .env file. Please add your Google AI Studio API key to .env'
    );
  }

  // Model cascade: try gemini-3.5-flash-lite first (fast, generous free tier), then gemini-3.6-flash
  const preferredModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const candidateModels = [preferredModel, 'gemini-3.6-flash'].filter((v, i, a) => a.indexOf(v) === i);

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      isMedicalDocument: { type: SchemaType.BOOLEAN },
      documentType: { type: SchemaType.STRING, enum: ["LAB_REPORT", "PRESCRIPTION", "IMAGING_REPORT", "DISCHARGE_SUMMARY", "CONSULTATION", "MEDICAL_CERTIFICATE", "OTHER"] },
      hospital: { type: SchemaType.STRING, nullable: true },
      doctor: { type: SchemaType.STRING, nullable: true },
      department: { type: SchemaType.STRING, nullable: true },
      date: { type: SchemaType.STRING, nullable: true },
      patientName: { type: SchemaType.STRING, nullable: true },
      summary: { type: SchemaType.STRING },
      labResults: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { testName: { type: SchemaType.STRING }, value: { type: SchemaType.STRING }, unit: { type: SchemaType.STRING }, referenceRange: { type: SchemaType.STRING }, status: { type: SchemaType.STRING } } } },
      medications: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { name: { type: SchemaType.STRING }, dosage: { type: SchemaType.STRING }, frequency: { type: SchemaType.STRING }, duration: { type: SchemaType.STRING }, instructions: { type: SchemaType.STRING } } } },
      findings: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
    },
    required: ["isMedicalDocument", "documentType", "summary", "labResults", "medications", "findings"]
  };

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = `Extract medical data from this document exactly matching the JSON schema. Use YYYY-MM-DD for dates. Write a warm patient-friendly summary. Return JSON null for missing fields.`;

  const documentPart = {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: mimeType,
    },
  };

  let responseText = '';
  let lastError = null;

  for (const currentModel of candidateModels) {
    console.log(`[Gemini AI] Attempting extraction with model: ${currentModel} (MIME: ${mimeType})`);
    try {
      const model = genAI.getGenerativeModel({
        model: currentModel,
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.1,
        },
      });

      const result = await model.generateContent([documentPart, prompt]);
      responseText = result.response.text();
      console.log(`[Gemini AI] Successfully received response using ${currentModel}`);
      break;
    } catch (err) {
      console.error(`[Gemini AI] Model ${currentModel} failed:`, err.message);
      lastError = err;
      // Continue loop to try next model in candidate list
    }
  }

  if (!responseText) {
    if (lastError && (lastError.message.includes('503') || lastError.message.includes('429'))) {
      throw new Error(`Google Gemini API error (${lastError.message.includes('429') ? '429 Quota/Rate limit' : '503 High Demand'}). Please try again in a few moments.`);
    }
    throw lastError || new Error('Failed to extract document with Gemini AI');
  }

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (err) {
    console.error('[Gemini AI] Failed to parse JSON response:', responseText);
    throw new Error('Gemini response could not be parsed as JSON: ' + err.message);
  }

  if (parsed.isMedicalDocument === false) {
    throw new Error('NOT_MEDICAL_DOCUMENT');
  }

  const sanitized = sanitizeAIResponse(parsed);
  console.log(`[Gemini AI] Extraction complete: type=${sanitized.documentType}, labs=${sanitized.labResults.length}, meds=${sanitized.medications.length}`);
  return sanitized;
}
