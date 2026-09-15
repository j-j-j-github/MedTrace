import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type DocumentType = Database['public']['Tables']['medical_records']['Row']['document_type'];

export interface AIProcessingResponse {
  documentType: DocumentType;
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

export const aiService = {
  async processMedicalDocument(recordId: string, filePath: string): Promise<AIProcessingResponse> {
    const useMockAI = import.meta.env.VITE_USE_MOCK_AI !== 'false';
    const aiApiUrl = import.meta.env.VITE_AI_API_URL;

    if (!useMockAI && aiApiUrl) {
      const response = await fetch(`${aiApiUrl}/process-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recordId, filePath }),
      });

      if (!response.ok) {
        throw new Error('AI Processing API returned an error');
      }

      return await response.json();
    }

    // Mock AI Mode
    console.log('[Mock AI] Processing document...', { recordId, filePath });
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const isLabReport = filePath.toLowerCase().includes('lab') || filePath.toLowerCase().includes('blood');

    if (isLabReport) {
      return {
        documentType: 'LAB_REPORT',
        hospital: 'ABC Hospital',
        doctor: 'Dr. Rahul Thomas',
        department: 'Pathology',
        date: new Date().toISOString().split('T')[0],
        patientName: 'Jane Doe',
        summary: "Your report contains a complete blood count. The report lists hemoglobin at 12.1 g/dL, with the laboratory's stated reference range of 13–17 g/dL. The reported hemoglobin value is below the reference range shown on the report. Discuss the result with your healthcare professional for interpretation.",
        labResults: [
          { testName: 'Hemoglobin', value: '12.1', unit: 'g/dL', referenceRange: '13-17', status: 'below_range' },
          { testName: 'WBC', value: '6.5', unit: 'thou/uL', referenceRange: '4.5-11.0', status: 'normal' },
        ],
        medications: [],
        findings: []
      };
    }

    return {
      documentType: 'PRESCRIPTION',
      hospital: 'City Hospital',
      doctor: 'Dr. Sarah Smith',
      department: 'General Medicine',
      date: new Date().toISOString().split('T')[0],
      patientName: 'Jane Doe',
      summary: "This document is a medical prescription for basic antibiotics and pain relief. Please follow the dosage instructions carefully.",
      labResults: [],
      medications: [
        { name: 'Amoxicillin', dosage: '500mg', frequency: 'Twice daily', duration: '5 days', instructions: 'Take after meals' },
        { name: 'Paracetamol', dosage: '650mg', frequency: 'As needed', duration: '3 days', instructions: 'For fever' }
      ],
      findings: []
    };
  }
};
