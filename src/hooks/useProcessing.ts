import { useState } from 'react';
import { useAuth } from './useAuth';
import { storageService } from '../services/storage';
import { recordService } from '../services/records';
import { aiService } from '../services/ai';
import { useNavigate } from 'react-router-dom';

export function useProcessing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string | null>(null);

  const processFile = async (file: File, customName?: string) => {
    if (!user) return;
    
    setError(null);
    setStatus('Uploading...');
    let currentRecordId: string | null = null;

    try {
      // 1. Upload to Supabase Storage
      const { filePath, recordId } = await storageService.uploadMedicalDocument(user.id, file);
      currentRecordId = recordId;

      // 2. Create Initial Record
      setStatus('Processing...');
      await recordService.createInitialRecord({
        id: recordId,
        user_id: user.id,
        file_path: filePath,
        file_name: customName && customName.trim() !== '' ? customName.trim() : file.name,
        file_type: file.type,
        processing_status: 'PROCESSING',
      });

      // 3. Send to AI Processing
      setStatus('Reading document...');
      const aiResponse = await aiService.processMedicalDocument(recordId, filePath);

      // 4. Extract and Save
      setStatus('Generating summary...');
      await recordService.saveAIProcessingResults(recordId, aiResponse);

      // 5. Complete
      setStatus('Complete');
      
      // Navigate to the record details
      navigate(`/records/${recordId}`);
      
    } catch (err: any) {
      console.error('Processing error:', err);
      const errorMessage = err.message || 'Unable to process this document. Please try again.';
      setError(errorMessage);
      setStatus('error');
      
      // Auto-delete if identified as non-medical document
      if (errorMessage.includes('not appear to be a valid medical document') && currentRecordId) {
        try {
          console.log('[useProcessing] Deleting non-medical record:', currentRecordId);
          await recordService.deleteRecord(currentRecordId);
        } catch (deleteErr) {
          console.error('[useProcessing] Failed to auto-delete non-medical record:', deleteErr);
        }
      }
    }
  };

  return { processFile, status, error };
}
