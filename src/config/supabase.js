import { createClient } from '@supabase/supabase-js';

// Environment variables - these should be set in your environment
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Database tables interfaces for TypeScript support
export const Database = {
  // Users table
  users: {
    id: 'uuid',
    phone: 'varchar',
    email: 'varchar',
    name: 'varchar',
    role: "'citizen' | 'government'",
    area: 'varchar',
    preferred_language: 'varchar',
    avatar_url: 'varchar',
    created_at: 'timestamp',
    updated_at: 'timestamp',
  },

  // Issues table
  issues: {
    id: 'uuid',
    reporter_id: 'uuid',
    category: 'varchar',
    description: 'text',
    latitude: 'decimal',
    longitude: 'decimal',
    address: 'varchar',
    status: "'open' | 'in_progress' | 'resolved' | 'closed'",
    priority: "'low' | 'medium' | 'high'",
    anonymous: 'boolean',
    government_assigned_id: 'uuid',
    created_at: 'timestamp',
    updated_at: 'timestamp',
  },

  // IssueMedia table
  issue_media: {
    id: 'uuid',
    issue_id: 'uuid',
    file_type: "'image' | 'audio'",
    file_url: 'varchar',
    original_filename: 'varchar',
    file_size: 'integer',
    transcription: 'text',
    created_at: 'timestamp',
  },

  // IssueMessages table
  issue_messages: {
    id: 'uuid',
    issue_id: 'uuid',
    sender_id: 'uuid',
    message: 'text',
    message_type: "'status_update' | 'government_response' | 'user_query'",
    media_urls: 'text[]',
    language: 'varchar',
    translated_message: 'text',
    created_at: 'timestamp',
  },
};

// Export types for better development experience
export type User = typeof Database.users;
export type Issue = typeof Database.issues;
export type IssueMedia = typeof Database.issue_media;
export type IssueMessage = typeof Database.issue_messages;

// Helper functions for common operations
export const authHelpers = {
  // Sign up with phone number
  signUpWithPhone: async (phone: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      phone,
      password,
      options: {
        data: userData,
      },
    });

    if (error) throw error;
    return data;
  },

  // Sign up with email
  signUpWithEmail: async (email: string, password: string, userData: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) throw error;
    return data;
  },

  // Sign in with phone
  signInWithPhone: async (phone: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Sign in with email
  signInWithEmail: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },
};

// Storage helpers for file uploads
export const storageHelpers = {
  // Upload image
  uploadImage: async (file: File, issueId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${issueId}/${Date.now()}.${fileExt}`;
    const filePath = `images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('issue-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('issue-media')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // Upload audio file
  uploadAudio: async (file: File, issueId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${issueId}/${Date.now()}.${fileExt}`;
    const filePath = `audio/${fileName}`;

    const { data, error } = await supabase.storage
      .from('issue-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('issue-media')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  // Delete file
  deleteFile: async (filePath: string) => {
    const { error } = await supabase.storage
      .from('issue-media')
      .remove([filePath]);

    if (error) throw error;
  },
};

export default supabase;