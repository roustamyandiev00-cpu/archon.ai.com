-- AI Generation & PDF Templates Migration
-- Adds support for AI generation, multimodal input, PDF templates, and sending methods

-- Add PDF template choice to user_settings
ALTER TABLE user_settings 
  ADD COLUMN IF NOT EXISTS pdf_template_choice VARCHAR(50) DEFAULT 'modern' 
  CHECK (pdf_template_choice IN ('modern', 'classic', 'minimal', 'professional'));

-- Add AI generation preferences
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS ai_default_tone VARCHAR(50) DEFAULT 'professional' 
  CHECK (ai_default_tone IN ('professional', 'friendly', 'formal', 'casual'));

-- Table for AI-generated content/conversations (multimodal input storage)
CREATE TABLE IF NOT EXISTS ai_conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('offerte', 'factuur', 'project', 'artikel', 'algemeen')),
  entity_id BIGINT,
  input_type VARCHAR(50) NOT NULL CHECK (input_type IN ('text', 'voice', 'document', 'image', 'combined')),
  input_content TEXT,
  extracted_text TEXT,
  ai_prompt TEXT,
  ai_response JSONB,
  generated_content JSONB,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_entity ON ai_conversations(entity_type, entity_id);

-- Table for uploaded documents/images for AI processing
CREATE TABLE IF NOT EXISTS ai_attachments (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES ai_conversations(id) ON DELETE CASCADE,
  file_name VARCHAR(255),
  file_type VARCHAR(100),
  file_size INTEGER,
  storage_path TEXT,
  extracted_text TEXT,
  ocr_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for attachments
CREATE INDEX IF NOT EXISTS idx_ai_attachments_conversation ON ai_attachments(conversation_id);

-- Table for PDF generation history
CREATE TABLE IF NOT EXISTS pdf_generations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('offerte', 'factuur')),
  entity_id BIGINT NOT NULL,
  template_used VARCHAR(50) NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for PDF generations
CREATE INDEX IF NOT EXISTS idx_pdf_generations_user ON pdf_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_generations_entity ON pdf_generations(entity_type, entity_id);

-- Table for sent documents (email/whatsapp history)
CREATE TABLE IF NOT EXISTS document_sends (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('offerte', 'factuur')),
  entity_id BIGINT NOT NULL,
  send_method VARCHAR(50) NOT NULL CHECK (send_method IN ('email', 'whatsapp')),
  recipient VARCHAR(255) NOT NULL,
  subject TEXT,
  message_content TEXT,
  pdf_generation_id BIGINT REFERENCES pdf_generations(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  external_message_id VARCHAR(255),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for document sends
CREATE INDEX IF NOT EXISTS idx_document_sends_user ON document_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_document_sends_entity ON document_sends(entity_type, entity_id);

-- Enable RLS on new tables
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own AI conversations" ON ai_conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own AI conversations" ON ai_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own AI conversations" ON ai_conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own AI conversations" ON ai_conversations
  FOR DELETE USING (user_id = auth.uid());

-- AI attachments inherit conversation permissions
CREATE POLICY "Users can view own attachments" ON ai_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_attachments.conversation_id 
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own attachments" ON ai_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = ai_attachments.conversation_id 
      AND ai_conversations.user_id = auth.uid()
    )
  );

-- PDF generations
CREATE POLICY "Users can view own PDFs" ON pdf_generations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own PDFs" ON pdf_generations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Document sends
CREATE POLICY "Users can view own sends" ON document_sends
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sends" ON document_sends
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
