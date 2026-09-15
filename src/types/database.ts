export type DocumentType =
  | 'LAB_REPORT'
  | 'PRESCRIPTION'
  | 'IMAGING_REPORT'
  | 'DISCHARGE_SUMMARY'
  | 'CONSULTATION'
  | 'MEDICAL_CERTIFICATE'
  | 'OTHER';

export type ProcessingStatus = 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          email: string;
          dob: string | null;
          gender: string | null;
          height: number | null;
          weight: number | null;
          preferred_unit: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          email: string;
          dob?: string | null;
          gender?: string | null;
          height?: number | null;
          weight?: number | null;
          preferred_unit?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          email?: string;
          dob?: string | null;
          gender?: string | null;
          height?: number | null;
          weight?: number | null;
          preferred_unit?: string | null;
          created_at?: string;
        };
      };
      medical_records: {
        Row: {
          id: string;
          user_id: string;
          file_path: string;
          file_name: string;
          file_type: string | null;
          document_type: DocumentType | null;
          hospital: string | null;
          doctor: string | null;
          department: string | null;
          record_date: string | null;
          patient_name: string | null;
          summary: string | null;
          processing_status: ProcessingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_path: string;
          file_name: string;
          file_type?: string | null;
          document_type?: DocumentType | null;
          hospital?: string | null;
          doctor?: string | null;
          department?: string | null;
          record_date?: string | null;
          patient_name?: string | null;
          summary?: string | null;
          processing_status?: ProcessingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_path?: string;
          file_name?: string;
          file_type?: string | null;
          document_type?: DocumentType | null;
          hospital?: string | null;
          doctor?: string | null;
          department?: string | null;
          record_date?: string | null;
          patient_name?: string | null;
          summary?: string | null;
          processing_status?: ProcessingStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      lab_results: {
        Row: {
          id: string;
          record_id: string;
          test_name: string;
          value: string | null;
          unit: string | null;
          reference_range: string | null;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          record_id: string;
          test_name: string;
          value?: string | null;
          unit?: string | null;
          reference_range?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          record_id?: string;
          test_name?: string;
          value?: string | null;
          unit?: string | null;
          reference_range?: string | null;
          status?: string | null;
          created_at?: string;
        };
      };
      medications: {
        Row: {
          id: string;
          record_id: string;
          name: string;
          dosage: string | null;
          frequency: string | null;
          duration: string | null;
          instructions: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          record_id: string;
          name: string;
          dosage?: string | null;
          frequency?: string | null;
          duration?: string | null;
          instructions?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          record_id?: string;
          name?: string;
          dosage?: string | null;
          frequency?: string | null;
          duration?: string | null;
          instructions?: string | null;
          created_at?: string;
        };
      };
      share_links: {
        Row: {
          id: string;
          record_id: string;
          created_by: string;
          token_hash: string;
          expires_at: string;
          allow_download: boolean;
          revoked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          record_id: string;
          created_by: string;
          token_hash: string;
          expires_at: string;
          allow_download?: boolean;
          revoked?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          record_id?: string;
          created_by?: string;
          token_hash?: string;
          expires_at?: string;
          allow_download?: boolean;
          revoked?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
