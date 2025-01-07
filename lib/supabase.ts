import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          created_at: string;
          email: string;
          role: 'patient' | 'healthcare_provider' | 'admin';
        };
      };
      patient_journals: {
        Row: {
          id: string;
          created_at: string;
          patient_id: string;
          title: string;
          status: 'active' | 'archived';
        };
      };
      journal_entries: {
        Row: {
          id: string;
          created_at: string;
          journal_id: string;
          content: string;
          summary: string | null;
          audio_url: string | null;
          created_by: string;
        };
      };
      medical_terms: {
        Row: {
          id: string;
          term: string;
          plain_language: string;
          category: string;
        };
      };
    };
  };
}
