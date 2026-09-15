import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Prefer Service Role Key for backend administrative operations; fallback to Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not fully configured in .env!');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: WebSocket
  }
});

/**
 * Determine MIME type based on file path extension
 * @param {string} filePath
 * @returns {string}
 */
export function getMimeTypeFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf':
      return 'application/pdf';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    case '.bmp':
      return 'image/bmp';
    default:
      return 'application/pdf'; // Default assumption for medical scans/documents
  }
}

/**
 * Securely download a file from the 'medical-records' private bucket
 * @param {string} filePath
 * @returns {Promise<{ buffer: Buffer, mimeType: string, fileSize: number }>}
 */
export async function downloadDocument(filePath) {
  if (!filePath) {
    throw new Error('No filePath provided for document download');
  }

  console.log(`[Supabase Storage] Downloading file: ${filePath} from bucket 'medical-records'...`);

  const { data, error } = await supabaseAdmin.storage
    .from('medical-records')
    .download(filePath);

  if (error) {
    console.error('[Supabase Storage Download Error]:', error);
    throw new Error(`Failed to download file from Supabase storage: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Prefer detected mime type if available, otherwise infer from filePath
  let mimeType = data.type;
  if (!mimeType || mimeType === 'application/octet-stream') {
    mimeType = getMimeTypeFromPath(filePath);
  }

  console.log(`[Supabase Storage] Successfully downloaded ${filePath} (${buffer.length} bytes, type: ${mimeType})`);

  return {
    buffer,
    mimeType,
    fileSize: buffer.length,
  };
}
