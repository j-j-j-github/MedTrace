import { GoogleGenerativeAI } from '@google/generative-ai';
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

  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  console.log(`[Gemini AI] Initializing model: ${modelName} with MIME type: ${mimeType}`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1,
    },
  });

  const prompt = `You are a clinical document AI specialist for "MedTrace", a patient medical record tracking system.
Your goal is to inspect this medical document (PDF or image) and extract key medical data with extreme precision.

CRITICAL EXTRACTION REQUIREMENTS:
0. isMedicalDocument:
   - Evaluate if the provided document or image is a legitimate medical-related document (e.g. lab report, prescription, medical bill, doctor's note, imaging report).
   - If it is completely unrelated (e.g. a picture of a cat, a random receipt, a landscape photo, a blank page), set this strictly to boolean \`false\`.
   - Otherwise, set it to boolean \`true\`.

1. documentType:
   Must be strictly one of these exact string values:
   - "LAB_REPORT"
   - "PRESCRIPTION"
   - "IMAGING_REPORT"
   - "DISCHARGE_SUMMARY"
   - "CONSULTATION"
   - "MEDICAL_CERTIFICATE"
   - "OTHER"

2. Null Safety:
   - If a field is not explicitly mentioned in the document (such as hospital, doctor, department, patientName, date), you MUST return JSON null.
   - NEVER output strings like "N/A", "Not specified", "Unknown", "Not found", or "None". Always return null.

3. Date Formatting:
   - Convert any dates found for the record into strict "YYYY-MM-DD" format (e.g. "2024-03-15").
   - If no valid date is present, return null.

4. Patient-Friendly Summary:
   - Do NOT just summarize or regurgitate clinical jargon.
   - Write a warm, compassionate, patient-friendly explanation in plain language explaining what the document means.
   - If it is a lab report, explain what out-of-range or abnormal metrics mean in simple, easy-to-understand terms so the patient is informed without unnecessary alarm.

5. Lab Results:
   - Extract all laboratory tests, blood work, or diagnostic metrics into an array.
   - Format: [ { "testName": "Hemoglobin", "value": "12.1", "unit": "g/dL", "referenceRange": "13-17", "status": "low" } ]
   - If not a lab report, return empty array [].

6. Medications:
   - Extract all prescribed or recorded medications into an array.
   - Format: [ { "name": "Amoxicillin", "dosage": "500mg", "frequency": "Twice daily", "duration": "5 days", "instructions": "Take after meals" } ]
   - If no medications are mentioned, return empty array [].

7. Findings:
   - Extract any key findings, radiological impressions, diagnosis, or observations into an array.

Return ONLY a JSON object matching this schema:
{
  "isMedicalDocument": boolean,
  "documentType": "LAB_REPORT" | "PRESCRIPTION" | "IMAGING_REPORT" | "DISCHARGE_SUMMARY" | "CONSULTATION" | "MEDICAL_CERTIFICATE" | "OTHER",
  "hospital": string | null,
  "doctor": string | null,
  "department": string | null,
  "date": string | null,
  "patientName": string | null,
  "summary": string,
  "labResults": [
    {
      "testName": string,
      "value": string,
      "unit": string,
      "referenceRange": string,
      "status": string
    }
  ],
  "medications": [
    {
      "name": string,
      "dosage": string,
      "frequency": string,
      "duration": string,
      "instructions": string
    }
  ],
  "findings": []
}`;

  const documentPart = {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType: mimeType,
    },
  };

  let responseText = '';
  let maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await model.generateContent([documentPart, prompt]);
      responseText = result.response.text();
      console.log(`[Gemini AI] Received raw response from model on attempt ${attempt + 1}`);
      break;
    } catch (err) {
      attempt++;
      console.error(`[Gemini AI] Attempt ${attempt} failed:`, err.message);
      if (attempt >= maxRetries) {
        if (err.message.includes('503')) {
          throw new Error('Google Gemini API is currently experiencing high demand (503). Please try uploading again in a few moments.');
        }
        throw err;
      }
      // Wait 2 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
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
