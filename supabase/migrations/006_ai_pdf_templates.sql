-- Migration: Add tables for AI generation, PDF templates, and document sending
-- Created: 2025-01-21

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- AI Conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT uuid_generate_v4(),
  prompt TEXT NOT NULL,
  response TEXT,
  entity_type TEXT CHECK (entity_type IN ('offerte', 'factuur', 'deal', 'project', 'artikel', 'algemeen')),
  entity_id UUID,
  tone TEXT DEFAULT 'professional' CHECK (tone IN ('professional', 'friendly', 'formal', 'casual')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Attachments table for multimodal input
CREATE TABLE IF NOT EXISTS ai_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  ocr_data JSONB,
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF Generations table
CREATE TABLE IF NOT EXISTS pdf_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('offerte', 'factuur')),
  entity_id UUID NOT NULL,
  template_name TEXT DEFAULT 'modern' CHECK (template_name IN ('modern', 'classic', 'minimal', 'professional')),
  pdf_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  status TEXT DEFAULT 'generated' CHECK (status IN ('generating', 'generated', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Sends table (email, WhatsApp, etc.)
CREATE TABLE IF NOT EXISTS document_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('offerte', 'factuur')),
  entity_id UUID NOT NULL,
  send_method TEXT NOT NULL CHECK (send_method IN ('email', 'whatsapp')),
  recipient TEXT NOT NULL,
  message_content TEXT,
  pdf_generation_id UUID REFERENCES pdf_generations(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  external_message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to user_settings for PDF template preference and AI tone
ALTER TABLE IF EXISTS user_settings 
ADD COLUMN IF NOT EXISTS pdf_template_choice TEXT DEFAULT 'modern' CHECK (pdf_template_choice IN ('modern', 'classic', 'minimal', 'professional'));

ALTER TABLE IF EXISTS user_settings 
ADD COLUMN IF NOT EXISTS ai_default_tone TEXT DEFAULT 'professional' CHECK (ai_default_tone IN ('professional', 'friendly', 'formal', 'casual'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_entity ON ai_conversations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_attachments_conversation_id ON ai_attachments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_pdf_generations_user_id ON pdf_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_generations_entity ON pdf_generations(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_document_sends_user_id ON document_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_document_sends_entity ON document_sends(entity_type, entity_id);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON ai_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON ai_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ai_attachments
CREATE POLICY "Users can view own attachments"
  ON ai_attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own attachments"
  ON ai_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments"
  ON ai_attachments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for pdf_generations
CREATE POLICY "Users can view own PDF generations"
  ON pdf_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own PDF generations"
  ON pdf_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own PDF generations"
  ON pdf_generations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for document_sends
CREATE POLICY "Users can view own document sends"
  ON document_sends FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own document sends"
  ON document_sends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own document sends"
  ON document_sends FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdf_generations_updated_at
  BEFORE UPDATE ON pdf_generations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_sends_updated_at
  BEFORE UPDATE ON document_sends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for AI attachments and PDFs (run in Supabase dashboard)
-- Note: This needs to be done via Supabase UI or API
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ai-attachments', 'ai-attachments', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('generated-pdfs', 'generated-pdfs', false);
