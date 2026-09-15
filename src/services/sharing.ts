import { supabase } from '../lib/supabase';

export const sharingService = {
  async generateShareLink(recordId: string, expiresInHours: number, allowDownload: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Generate a secure random token
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
      
    // In a real app we'd hash the token for DB storage, but for the MVP we can store directly 
    // or hash it with SHA-256 for basic security.
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const { error } = await supabase
      .from('share_links')
      .insert([{
        record_id: recordId,
        created_by: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        allow_download: allowDownload
      }]);

    if (error) throw error;
    return token;
  },

  async getActiveShares() {
    // Need to fetch via record to show what is shared
    const { data, error } = await supabase
      .from('share_links')
      .select(`
        *,
        medical_records (
          file_name,
          hospital,
          document_type
        )
      `)
      .eq('revoked', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async revokeShare(id: string) {
    const { error } = await supabase
      .from('share_links')
      .update({ revoked: true })
      .eq('id', id);

    if (error) throw error;
  },
  
  async getSharedRecordByToken(token: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Query share links (bypassing RLS because it's public)
    const { data: linkData, error: linkError } = await supabase
      .from('share_links')
      .select(`
        *,
        medical_records (
          *,
          profiles (full_name),
          lab_results (*),
          medications (*)
        )
      `)
      .eq('token_hash', tokenHash)
      .single();

    if (linkError) throw linkError;
    if (!linkData) throw new Error('Invalid link');
    
    // Check revocation and expiry
    if (linkData.revoked) throw new Error('This link has been revoked');
    if (new Date(linkData.expires_at) < new Date()) throw new Error('This link has expired');

    return linkData;
  }
};
