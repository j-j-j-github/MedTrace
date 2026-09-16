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

  const processFiles = async (files: File[], customNames?: string[]) => {
    if (!user) return;
    
    setError(null);
    setStatus('Uploading files securely...');
    
    let hasError = false;
    let lastRecordId: string | null = null;
    const uploadedRecords: { recordId: string, filePath: string, fileName: string }[] = [];

    // Phase 1: Upload all files quickly to Storage and create DB records
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const customName = customNames?.[i];
      
      try {
        const { filePath, recordId } = await storageService.uploadMedicalDocument(user.id, file);
        lastRecordId = recordId;
        
        await recordService.createInitialRecord({
          id: recordId,
          user_id: user.id,
          file_path: filePath,
          file_name: customName && customName.trim() !== '' ? customName.trim() : file.name,
          file_type: file.type,
          processing_status: 'PROCESSING',
        });
        
        uploadedRecords.push({ recordId, filePath, fileName: file.name });
      } catch (err: any) {
        console.error('Upload error for file', file.name, err);
        setError(err.message || `Unable to upload ${file.name}.`);
        setStatus('error');
        hasError = true;
        break; // Stop if upload fails
      }
    }

    if (hasError || uploadedRecords.length === 0) return;

    // Phase 2: Kick off AI processing sequentially in the background
    // We do NOT await this. It runs in the background.
    const processAIQueue = async () => {
      for (let i = 0; i < uploadedRecords.length; i++) {
        const record = uploadedRecords[i];
        try {
          console.log(`[useProcessing] Starting background AI processing for ${record.fileName}...`);
          const aiResponse = await aiService.processMedicalDocument(record.recordId, record.filePath);
          await recordService.saveAIProcessingResults(record.recordId, aiResponse);
          console.log(`[useProcessing] Finished background AI processing for ${record.fileName}.`);
        } catch (err: any) {
          console.error(`[useProcessing] AI Processing error for ${record.fileName}:`, err);
          
          // Auto-delete if identified as non-medical document
          if (err.message?.includes('not appear to be a valid medical document')) {
            try {
              console.log('[useProcessing] Deleting non-medical record:', record.recordId);
              await recordService.deleteRecord(record.recordId);
            } catch (deleteErr) {
              console.error('[useProcessing] Failed to auto-delete non-medical record:', deleteErr);
            }
          } else {
             // Mark as failed in DB
             try {
                await recordService.updateRecordStatus(record.recordId, 'FAILED');
             } catch(statusErr) {
                console.error('[useProcessing] Failed to update status to FAILED:', statusErr);
             }
          }
        }
      }
    };
    
    // Start the background processing
    processAIQueue();

    // Immediately navigate away so the user doesn't wait
    setStatus('Complete');
    if (files.length === 1 && lastRecordId) {
      navigate(`/records/${lastRecordId}`);
    } else {
      navigate(`/records`);
    }
  };

  return { processFiles, status, error };
}
