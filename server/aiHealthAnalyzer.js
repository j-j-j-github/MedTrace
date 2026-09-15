import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export async function analyzeHealthData(profile, medicalRecords) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      healthScore: { type: SchemaType.NUMBER, description: "A score from 0 to 100 representing overall health" },
      activeConditions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Identified medical conditions or risks" },
      keyMetrics: { 
        type: SchemaType.ARRAY, 
        items: { 
          type: SchemaType.OBJECT, 
          properties: {
            name: { type: SchemaType.STRING },
            value: { type: SchemaType.STRING },
            status: { type: SchemaType.STRING, enum: ["normal", "warning", "critical"] }
          } 
        } 
      },
      insights: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Actionable health insights based on the user's data" }
    },
    required: ["healthScore", "activeConditions", "keyMetrics", "insights"]
  };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.2,
    },
  });

  // Calculate age if dob exists
  let ageStr = "Unknown";
  if (profile.dob) {
    const diff = Date.now() - new Date(profile.dob).getTime();
    ageStr = Math.abs(new Date(diff).getUTCFullYear() - 1970).toString() + " years";
  }

  const prompt = `
  You are an expert AI medical health analyzer.
  Analyze the following patient profile and their past medical records to determine their overall health condition.
  
  Patient Profile:
  - Age: ${ageStr}
  - Gender: ${profile.gender || 'Unknown'}
  - Height: ${profile.height ? profile.height + ' cm' : 'Unknown'}
  - Weight: ${profile.weight ? profile.weight + ' kg' : 'Unknown'}
  
  Medical Records Summary:
  ${medicalRecords.map(r => `- ${r.document_type} on ${r.record_date}: ${r.summary}`).join('\n')}
  
  Please provide a health score (0-100), identify any active conditions or risks, highlight key metrics to monitor, and provide actionable insights.
  Make it easy to understand for the patient.
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (err) {
    console.error('[Health Analyzer] Failed:', err);
    throw new Error('Failed to generate health analysis');
  }
}
