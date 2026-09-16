import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import { aiService, AIProcessingResponse } from './ai';

type MedicalRecordInsert = Database['public']['Tables']['medical_records']['Insert'];
type ProcessingStatus = Database['public']['Tables']['medical_records']['Row']['processing_status'];

let recordsCache: any[] | null = null;
let recordsCacheTime: number = 0;
const RECORDS_CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const recordService = {
  async createInitialRecord(record: MedicalRecordInsert) {
    const { data, error } = await supabase
      .from('medical_records')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    recordsCache = null; // Invalidate cache
    return data;
  },

  async updateRecordStatus(id: string, status: ProcessingStatus) {
    const { error } = await supabase
      .from('medical_records')
      .update({ processing_status: status })
      .eq('id', id);

    if (error) throw error;
    recordsCache = null; // Invalidate cache
  },

  async saveAIProcessingResults(recordId: string, result: AIProcessingResponse) {
    // 1. Update the medical record
    const updates: any = {
      document_type: result.documentType,
      hospital: result.hospital,
      doctor: result.doctor,
      department: result.department,
      record_date: result.date,
      patient_name: result.patientName,
      summary: result.summary,
      processing_status: 'COMPLETED'
    };

    if (result.title) {
      updates.file_name = result.title;
    }

    const { error: recordError } = await supabase
      .from('medical_records')
      .update(updates)
      .eq('id', recordId);

    if (recordError) throw recordError;

    // 2. Insert Lab Results if any
    if (result.labResults && result.labResults.length > 0) {
      const labInserts = result.labResults.map(lab => ({
        record_id: recordId,
        test_name: lab.testName,
        value: lab.value,
        unit: lab.unit,
        reference_range: lab.referenceRange,
        status: lab.status
      }));
      
      const { error: labError } = await supabase
        .from('lab_results')
        .insert(labInserts);
        
      if (labError) throw labError;
    }

    // 3. Insert Medications if any
    if (result.medications && result.medications.length > 0) {
      const medInserts = result.medications.map(med => ({
        record_id: recordId,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions
      }));
      
      const { error: medError } = await supabase
        .from('medications')
        .insert(medInserts);
        
      if (medError) throw medError;
    }
    
    recordsCache = null; // Invalidate cache
  },
  
  async getRecords(forceRefresh: boolean = false) {
    if (!forceRefresh && recordsCache && (Date.now() - recordsCacheTime < RECORDS_CACHE_TTL)) {
      return recordsCache;
    }

    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    recordsCache = data;
    recordsCacheTime = Date.now();
    return data;
  },
  
  async getRecordById(id: string) {
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        *,
        lab_results (*),
        medications (*)
      `)
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async deleteRecord(id: string) {
    // 1. Get the record to find its file path before deleting
    const { data: record } = await supabase
      .from('medical_records')
      .select('file_path')
      .eq('id', id)
      .single();

    // 2. Delete child records to satisfy any potential foreign key constraints (fallback if no cascade)
    await supabase.from('lab_results').delete().eq('record_id', id);
    await supabase.from('medications').delete().eq('record_id', id);

    // 3. Delete the medical record
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', id);
      
    if (error) throw error;

    // 4. Delete the physical file from the storage bucket
    if (record?.file_path) {
      const { error: storageError } = await supabase.storage
        .from('medical-records')
        .remove([record.file_path]);
        
      if (storageError) {
        console.error('Failed to delete file from storage:', storageError);
      }
    }
    
    recordsCache = null; // Invalidate cache
  }
};
