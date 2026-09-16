import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type DocumentType = Database['public']['Tables']['medical_records']['Row']['document_type'];

export interface AIProcessingResponse {
  documentType: DocumentType;
  title: string | null;
  hospital: string | null;
  doctor: string | null;
  department: string | null;
  date: string | null;
  patientName: string | null;
  summary: string;
  labResults: Array<{
    testName: string;
    value: string;
    unit: string;
    referenceRange: string;
    status: string;
  }>;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  findings: any[];
}

let healthAnalysisCache: { timestamp: number; data: any; profileId: string | undefined } | null = null;
const CACHE_TTL = 1000 * 60 * 15; // 15 minutes

export const aiService = {
  async processMedicalDocument(recordId: string, filePath: string): Promise<AIProcessingResponse> {
    const aiApiUrl = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000';

    console.log(`[AI Service] Processing document via backend...`, { recordId, filePath });
    
    const response = await fetch(`${aiApiUrl}/process-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId, filePath }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[AI Service] Error response:', errorData);
      throw new Error(errorData.error || 'AI Processing API returned an error');
    }

    return await response.json();
  },

  async analyzeHealth(profile: any, records: any[], forceRefresh: boolean = false): Promise<any> {
    if (!forceRefresh && healthAnalysisCache && healthAnalysisCache.profileId === profile?.id && (Date.now() - healthAnalysisCache.timestamp < CACHE_TTL)) {
      console.log('[AI Service] Returning cached health analysis');
      return healthAnalysisCache.data;
    }

    const aiApiUrl = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000';
    
    console.log(`[AI Service] Triggering health analysis...`);
    
    const response = await fetch(`${aiApiUrl}/analyze-health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, records }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to generate health analysis');
    }

    const data = await response.json();
    healthAnalysisCache = { timestamp: Date.now(), data, profileId: profile?.id };
    return data;
  }
};
