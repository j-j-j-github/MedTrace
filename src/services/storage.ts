import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export const storageService = {
  async uploadMedicalDocument(userId: string, file: File): Promise<{ filePath: string, recordId: string }> {
    const recordId = uuidv4();
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${recordId}/${recordId}.${fileExt}`;

    const { error } = await supabase.storage
      .from('medical-records')
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    return { filePath, recordId };
  },

  async getDocumentUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('medical-records')
      .createSignedUrl(filePath, 3600); // 1 hour expiry for temporary viewing

    if (error) throw error;
    return data.signedUrl;
  }
};
